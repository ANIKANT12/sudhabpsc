import {
  getSubjects,
  saveSubject,
  getChapters,
  saveChapter,
  getPages,
  savePage,
  replaceAllPages,
  permanentlyDeletePage,
  getSettings,
} from './storage';
import { compressImage } from '../utils/imageProcessor';

const DEFAULT_SYNC_CODE = 'SudhaBPSC';

// Event listeners for sync state changes
let currentSyncState = {
  status: 'idle', // 'idle' | 'syncing' | 'success' | 'error'
  lastSyncedAt: null,
  error: null,
};

const listeners = new Set();

export const subscribeSyncStatus = (callback) => {
  listeners.add(callback);
  callback(currentSyncState);
  return () => listeners.delete(callback);
};

const notifyListeners = (updates) => {
  currentSyncState = { ...currentSyncState, ...updates };
  listeners.forEach((cb) => {
    try {
      cb(currentSyncState);
    } catch (e) {
      console.warn('Sync listener error:', e);
    }
  });
};

export const getSyncCode = async () => {
  try {
    const settings = await getSettings();
    return (settings?.syncCode || DEFAULT_SYNC_CODE).trim();
  } catch (e) {
    return DEFAULT_SYNC_CODE;
  }
};

/**
 * Fetch cloud data for given sync code
 */
export const fetchCloudNotes = async (syncCode = null) => {
  const code = syncCode || (await getSyncCode());
  const response = await fetch(`/api/sync?code=${encodeURIComponent(code)}`, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Sync API responded with status ${response.status}`);
  }

  const data = await response.json();
  return data;
};

/**
 * Push a single page incrementally to the cloud (fast & lightweight)
 */
export const pushSinglePageToCloud = async (page, syncCode = null) => {
  try {
    const code = syncCode || (await getSyncCode());
    if (!page || !page.id) return;

    notifyListeners({ status: 'syncing' });

    // Ensure image strings are safe for Vercel/Neon (< 400KB each)
    let pageToSend = { ...page };
    if (pageToSend.originalDataUrl && pageToSend.originalDataUrl.length > 1000000) {
      try {
        pageToSend.originalDataUrl = await compressImage(pageToSend.originalDataUrl, 1600, 0.82);
      } catch (e) {
        console.warn('Original compression note:', e);
      }
    }
    if (pageToSend.processedDataUrl && pageToSend.processedDataUrl.length > 1000000) {
      try {
        pageToSend.processedDataUrl = await compressImage(pageToSend.processedDataUrl, 1600, 0.82);
      } catch (e) {
        console.warn('Processed compression note:', e);
      }
    }

    const response = await fetch('/api/sync', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        code,
        singlePage: pageToSend,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Cloud push failed (${response.status}): ${errText}`);
    }

    notifyListeners({
      status: 'success',
      lastSyncedAt: new Date().toISOString(),
      error: null,
    });
  } catch (err) {
    console.warn('Incremental cloud page push error:', err);
    notifyListeners({
      status: 'error',
      error: err.message,
    });
  }
};

/**
 * Delete a page permanently from the cloud
 */
export const deletePageFromCloud = async (pageId, syncCode = null) => {
  try {
    const code = syncCode || (await getSyncCode());
    if (!pageId) return;

    notifyListeners({ status: 'syncing' });

    const response = await fetch('/api/sync', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        code,
        deletePageId: pageId,
      }),
    });

    if (!response.ok) {
      throw new Error(`Cloud page delete failed with status ${response.status}`);
    }

    notifyListeners({
      status: 'success',
      lastSyncedAt: new Date().toISOString(),
      error: null,
    });
  } catch (err) {
    console.warn('Cloud page delete error:', err);
    notifyListeners({
      status: 'error',
      error: err.message,
    });
  }
};

/**
 * Push subjects and chapters metadata to cloud
 */
export const pushMetadataToCloud = async (subjects, chapters, syncCode = null) => {
  try {
    const code = syncCode || (await getSyncCode());
    notifyListeners({ status: 'syncing' });

    const response = await fetch('/api/sync', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        code,
        subjects,
        chapters,
      }),
    });

    if (!response.ok) {
      throw new Error(`Metadata push failed with status ${response.status}`);
    }

    notifyListeners({
      status: 'success',
      lastSyncedAt: new Date().toISOString(),
      error: null,
    });
  } catch (err) {
    console.warn('Cloud metadata push error:', err);
    notifyListeners({
      status: 'error',
      error: err.message,
    });
  }
};

/**
 * Perform a full two-way synchronization between local IndexedDB and Neon Cloud
 * Returns { hasChanges, subjects, chapters, pages }
 */
export const syncWithCloud = async (options = {}) => {
  const { onProgress } = options;
  try {
    notifyListeners({ status: 'syncing', error: null });

    const code = await getSyncCode();
    const localSubjects = (await getSubjects()) || [];
    const localChapters = (await getChapters()) || [];
    const localPages = (await getPages(null, true)) || [];

    // 1. Fetch from cloud
    const cloudData = await fetchCloudNotes(code);
    const cloudSubjects = cloudData?.subjects || [];
    const cloudChapters = cloudData?.chapters || [];
    const cloudPages = cloudData?.pages || [];

    let hasLocalChanges = false;

    // 2. Merge Subjects
    const subjectMap = new Map();
    localSubjects.forEach((s) => subjectMap.set(s.id, s));
    cloudSubjects.forEach((cs) => {
      if (!subjectMap.has(cs.id)) {
        subjectMap.set(cs.id, cs);
        hasLocalChanges = true;
      }
    });
    const mergedSubjects = Array.from(subjectMap.values());
    if (mergedSubjects.length !== localSubjects.length) {
      for (const s of mergedSubjects) {
        await saveSubject(s);
      }
    }

    // 3. Merge Chapters
    const chapterMap = new Map();
    localChapters.forEach((c) => chapterMap.set(c.id, c));
    cloudChapters.forEach((cc) => {
      if (!chapterMap.has(cc.id)) {
        chapterMap.set(cc.id, cc);
        hasLocalChanges = true;
      } else {
        const local = chapterMap.get(cc.id);
        const cloudUpdated = new Date(cc.updatedAt || 0).getTime();
        const localUpdated = new Date(local.updatedAt || 0).getTime();
        if (cloudUpdated > localUpdated) {
          chapterMap.set(cc.id, cc);
          hasLocalChanges = true;
        }
      }
    });
    const mergedChapters = Array.from(chapterMap.values());
    for (const c of mergedChapters) {
      await saveChapter(c);
    }

    // 4. Merge Pages
    const pageMap = new Map();
    localPages.forEach((p) => pageMap.set(p.id, p));

    const pagesToPushToCloud = [];

    // Compare cloud pages with local
    cloudPages.forEach((cp) => {
      const local = pageMap.get(cp.id);
      if (!local) {
        // Page exists on cloud (e.g. uploaded from phone), but not locally on PC
        pageMap.set(cp.id, cp);
        hasLocalChanges = true;
      } else {
        const cloudTime = new Date(cp.updatedAt || 0).getTime();
        const localTime = new Date(local.updatedAt || 0).getTime();
        if (cloudTime > localTime) {
          pageMap.set(cp.id, cp);
          hasLocalChanges = true;
        } else if (localTime > cloudTime) {
          pagesToPushToCloud.push(local);
        }
      }
    });

    // Check which local pages aren't yet on cloud
    const cloudPageIdSet = new Set(cloudPages.map((p) => p.id));
    localPages.forEach((lp) => {
      if (!cloudPageIdSet.has(lp.id)) {
        pagesToPushToCloud.push(lp);
      }
    });

    const mergedPages = Array.from(pageMap.values());

    // Save newly arrived cloud pages to local IndexedDB
    if (hasLocalChanges) {
      await replaceAllPages(mergedPages);
    }

    // 5. Push any local-only or newer items up to Cloud
    // First push metadata
    try {
      await fetch('/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code,
          subjects: mergedSubjects,
          chapters: mergedChapters,
        }),
      });
    } catch (metaErr) {
      console.warn('Metadata push warning:', metaErr);
    }

    // Push local-only pages to cloud (1 page at a time with auto-compression)
    if (pagesToPushToCloud.length > 0) {
      for (const p of pagesToPushToCloud) {
        let pToSend = { ...p };
        if (pToSend.originalDataUrl && pToSend.originalDataUrl.length > 1000000) {
          try {
            pToSend.originalDataUrl = await compressImage(pToSend.originalDataUrl, 1600, 0.82);
          } catch (e) {}
        }
        if (pToSend.processedDataUrl && pToSend.processedDataUrl.length > 1000000) {
          try {
            pToSend.processedDataUrl = await compressImage(pToSend.processedDataUrl, 1600, 0.82);
          } catch (e) {}
        }
        try {
          await fetch('/api/sync', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              code,
              singlePage: pToSend,
            }),
          });
        } catch (pagePushErr) {
          console.warn('Sync page push warning:', pagePushErr);
        }
      }
    }

    const now = new Date().toISOString();
    notifyListeners({
      status: 'success',
      lastSyncedAt: now,
      error: null,
    });

    return {
      hasChanges: hasLocalChanges || pagesToPushToCloud.length > 0,
      subjects: mergedSubjects,
      chapters: mergedChapters,
      pages: mergedPages,
    };
  } catch (err) {
    console.warn('Sync failed:', err);
    notifyListeners({
      status: 'error',
      error: err.message,
    });
    return { hasChanges: false, error: err.message };
  }
};
