import { get, set, del } from 'idb-keyval';

const SUBJECTS_KEY = 'sudha_bpsc_subjects';
const CHAPTERS_KEY = 'sudha_bpsc_chapters';
const PAGES_KEY = 'sudha_bpsc_pages';
const SETTINGS_KEY = 'sudha_bpsc_settings';

const DEFAULT_KEY_B64 = 'QVEuQWI4Uk42SzBTdmlQLTRzWGlVQ2pmZTFycVlFSGpvWTJLV3A3TnNMUlF5YWtlQlAyVEE=';
const resolveDefaultKey = () => {
  try {
    return typeof atob !== 'undefined' ? atob(DEFAULT_KEY_B64) : '';
  } catch (e) {
    return '';
  }
};

// Default BPSC Subjects tailored for Sudha's preparation
export const DEFAULT_SUBJECTS = [
  {
    id: 'subj-history',
    title: 'भारतीय इतिहास',
    englishTitle: 'Indian History',
    hindiTitle: 'भारतीय इतिहास',
    icon: '📜',
    color: 'from-amber-600 to-amber-800',
    badgeColor: 'bg-amber-100 text-amber-800 border-amber-300',
    description: 'प्राचीन, मध्यकालीन एवं आधुनिक भारत का इतिहास तथा स्वतंत्रता संग्राम',
  },
  {
    id: 'subj-bihar-history',
    title: 'बिहार का इतिहास एवं संस्कृति',
    englishTitle: 'Bihar History & Culture',
    hindiTitle: 'बिहार का इतिहास एवं संस्कृति',
    icon: '🏛️',
    color: 'from-rose-600 to-red-800',
    badgeColor: 'bg-rose-100 text-rose-800 border-rose-300',
    description: 'प्राचीन मगध, बौद्ध एवं जैन धर्म, चंपारण सत्याग्रह, 1857 की क्रांति में बिहार',
  },
  {
    id: 'subj-geography',
    title: 'भूगोल एवं बिहार का भूगोल',
    englishTitle: 'Geography & Bihar Mapping',
    hindiTitle: 'भूगोल एवं बिहार का भूगोल',
    icon: '🌍',
    color: 'from-emerald-600 to-teal-800',
    badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    description: 'भौतिक भूगोल, भारतीय मानसून, बिहार की नदियां, मिट्टी एवं कृषि जलवायु',
  },
  {
    id: 'subj-polity',
    title: 'भारतीय राजव्यवस्था एवं संविधान',
    englishTitle: 'Indian Polity & Governance',
    hindiTitle: 'भारतीय राजव्यवस्था एवं संविधान',
    icon: '⚖️',
    color: 'from-blue-600 to-indigo-800',
    badgeColor: 'bg-blue-100 text-blue-800 border-blue-300',
    description: 'प्रस्तावना, मौलिक अधिकार, संसद, राज्यपाल, पंचायती राज एवं शासन व्यवस्था',
  },
  {
    id: 'subj-economy',
    title: 'अर्थव्यवस्था एवं बिहार आर्थिक सर्वेक्षण',
    englishTitle: 'Economy & Bihar Economic Survey',
    hindiTitle: 'अर्थव्यवस्था एवं आर्थिक सर्वेक्षण',
    icon: '💰',
    color: 'from-green-600 to-emerald-800',
    badgeColor: 'bg-green-100 text-green-800 border-green-300',
    description: 'भारतीय अर्थव्यवस्था, बजट, नीति आयोग, बिहार आर्थिक सर्वेक्षण एवं सरकारी योजनाएं',
  },
  {
    id: 'subj-science',
    title: 'सामान्य विज्ञान',
    englishTitle: 'General Science',
    hindiTitle: 'सामान्य विज्ञान',
    icon: '🔬',
    color: 'from-cyan-600 to-blue-800',
    badgeColor: 'bg-cyan-100 text-cyan-800 border-cyan-300',
    description: 'BPSC प्रारंभिक व मुख्य परीक्षा हेतु जीव विज्ञान, भौतिकी एवं रसायन विज्ञान',
  },
  {
    id: 'subj-environment',
    title: 'पर्यावरण एवं पारिस्थितिकी',
    englishTitle: 'Environment & Ecology',
    hindiTitle: 'पर्यावरण एवं पारिस्थितिकी',
    icon: '🌿',
    color: 'from-lime-600 to-green-800',
    badgeColor: 'bg-lime-100 text-lime-800 border-lime-300',
    description: 'जैव विविधता, जलवायु परिवर्तन, रामसर स्थल, बिहार के राष्ट्रीय उद्यान व अभयारण्य',
  },
  {
    id: 'subj-current-affairs',
    title: 'समसामयिकी (करेंट अफेयर्स)',
    englishTitle: 'Current Affairs',
    hindiTitle: 'समसामयिकी (करेंट अफेयर्स)',
    icon: '📰',
    color: 'from-purple-600 to-violet-800',
    badgeColor: 'bg-purple-100 text-purple-800 border-purple-300',
    description: 'राष्ट्रीय, अंतर्राष्ट्रीय एवं बिहार राज्य स्तरीय मासिक घटनाक्रम',
  },
  {
    id: 'subj-hindi',
    title: 'सामान्य हिन्दी',
    englishTitle: 'General Hindi',
    hindiTitle: 'सामान्य हिन्दी',
    icon: '📖',
    color: 'from-orange-600 to-amber-800',
    badgeColor: 'bg-orange-100 text-orange-800 border-orange-300',
    description: 'BPSC मुख्य परीक्षा अनिवार्य पत्र: निबंध, व्याकरण, संक्षेपण एवं वाक्य विन्यास',
  },
  {
    id: 'subj-bpsc-special',
    title: 'बीपीएससी विशेष एवं विगत वर्ष प्रश्न (PYQ)',
    englishTitle: 'BPSC Special & PYQs',
    hindiTitle: 'बीपीएससी विशेष एवं विगत वर्ष प्रश्न',
    icon: '🎯',
    color: 'from-fuchsia-600 to-pink-800',
    badgeColor: 'bg-fuchsia-100 text-fuchsia-800 border-fuchsia-300',
    description: 'विगत वर्षों के प्रश्न विश्लेषण, मुख्य परीक्षा उत्तर लेखन एवं महत्वपूर्ण नोट्स',
  },
];

// Sample Initial Chapters
const DEFAULT_CHAPTERS = [
  {
    id: 'chap-1857',
    subjectId: 'subj-history',
    chapterNo: 1,
    title: '1857 का विद्रोह एवं वीर कुंवर सिंह की भूमिका',
    hindiTitle: '1857 का विद्रोह एवं वीर कुंवर सिंह की भूमिका',
    tags: ['BPSC', 'आधुनिक इतिहास', 'प्रारंभिक परीक्षा', 'मुख्य परीक्षा'],
    description: 'विद्रोह के कारण, जगदीशपुर केंद्र, वीर कुंवर सिंह का नेतृत्व एवं परिणाम।',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'chap-champaran',
    subjectId: 'subj-bihar-history',
    chapterNo: 1,
    title: 'चंपारण सत्याग्रह (1917) एवं गांधी जी',
    hindiTitle: 'चंपारण सत्याग्रह (1917) एवं गांधी जी',
    tags: ['BPSC विशेष', 'स्वतंत्रता संग्राम', 'अति महत्वपूर्ण'],
    description: 'तिनकठिया प्रणाली, राजकुमार शुक्ल का आमंत्रण एवं गांधी जी का प्रथम सत्याग्रह।',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'chap-fund-rights',
    subjectId: 'subj-polity',
    chapterNo: 1,
    title: 'मौलिक अधिकार (अनुच्छेद 12-35)',
    hindiTitle: 'मौलिक अधिकार (अनुच्छेद 12-35)',
    tags: ['राजव्यवस्था', 'संविधान', 'प्रारंभिक परीक्षा'],
    description: 'समानता का अधिकार, संवैधानिक उपचार, रिट एवं ऐतिहासिक वाद।',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

// Safe wrapper with IndexedDB and localStorage fallback
const dbGet = async (key) => {
  try {
    const val = await Promise.race([
      get(key),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('IDB timeout')), 10000)
      ),
    ]);
    if (val !== undefined && val !== null) return val;
  } catch (e) {
    console.warn(`IDB get ${key} note:`, e);
  }
  if (key !== PAGES_KEY) {
    try {
      const local = localStorage.getItem(key);
      return local ? JSON.parse(local) : null;
    } catch (e) {
      return null;
    }
  }
  return null;
};

const dbSet = async (key, val) => {
  try {
    await set(key, val);
  } catch (e) {
    console.warn(`IDB set ${key} note:`, e);
  }
  // Never mirror image collections (PAGES_KEY) to 5MB localStorage
  if (key !== PAGES_KEY) {
    try {
      localStorage.setItem(key, JSON.stringify(val));
    } catch (e) {
      // quota exceeded or private mode
    }
  }
};

// Initialize Storage if empty
export const initStorage = async () => {
  try {
    const existingSubjects = await dbGet(SUBJECTS_KEY);
    if (!existingSubjects || existingSubjects.length === 0) {
      await dbSet(SUBJECTS_KEY, DEFAULT_SUBJECTS);
    }

    const existingChapters = await dbGet(CHAPTERS_KEY);
    if (!existingChapters || existingChapters.length === 0) {
      await dbSet(CHAPTERS_KEY, DEFAULT_CHAPTERS);
    }

    const existingPages = await dbGet(PAGES_KEY);
    if (!existingPages) {
      await dbSet(PAGES_KEY, []);
    }

    const existingSettings = await dbGet(SETTINGS_KEY);
    if (!existingSettings) {
      await dbSet(SETTINGS_KEY, {
        defaultFilter: 'magic_color',
        autoDetectCorners: true,
        autoOcr: true,
        highQualityPdf: true,
        geminiApiKey: resolveDefaultKey(),
        pinLock: '',
        isPinEnabled: false,
      });
    }
  } catch (err) {
    console.warn('initStorage safe fallback triggered:', err);
  }
};

// Subject Operations
export const getSubjects = async () => {
  const subjects = await dbGet(SUBJECTS_KEY);
  return subjects || DEFAULT_SUBJECTS;
};

export const saveSubject = async (subject) => {
  const subjects = await getSubjects();
  const index = subjects.findIndex((s) => s.id === subject.id);
  if (index >= 0) {
    subjects[index] = subject;
  } else {
    subjects.push(subject);
  }
  await dbSet(SUBJECTS_KEY, subjects);
  return subjects;
};

export const deleteSubject = async (subjectId) => {
  const subjects = await getSubjects();
  const updated = subjects.filter((s) => s.id !== subjectId);
  await dbSet(SUBJECTS_KEY, updated);

  // Soft-delete all chapters and pages belonging to this subject
  const chapters = (await dbGet(CHAPTERS_KEY)) || [];
  const updatedChapters = chapters.filter((c) => c.subjectId !== subjectId);
  await dbSet(CHAPTERS_KEY, updatedChapters);

  const pages = (await dbGet(PAGES_KEY)) || [];
  const updatedPages = pages.map((p) =>
    p.subjectId === subjectId ? { ...p, isDeleted: true } : p
  );
  await dbSet(PAGES_KEY, updatedPages);

  return updated;
};

// Chapter Operations
export const getChapters = async (subjectId = null) => {
  const chapters = (await dbGet(CHAPTERS_KEY)) || [];
  if (subjectId) {
    return chapters.filter((c) => c.subjectId === subjectId);
  }
  return chapters;
};

export const saveChapter = async (chapter) => {
  const chapters = (await dbGet(CHAPTERS_KEY)) || [];
  const index = chapters.findIndex((c) => c.id === chapter.id);
  const now = new Date().toISOString();
  if (index >= 0) {
    chapters[index] = { ...chapter, updatedAt: now };
  } else {
    chapters.push({
      ...chapter,
      id: chapter.id || `chap-${Date.now()}`,
      createdAt: now,
      updatedAt: now,
    });
  }
  await dbSet(CHAPTERS_KEY, chapters);
  return chapters;
};

export const deleteChapter = async (chapterId) => {
  const chapters = (await dbGet(CHAPTERS_KEY)) || [];
  const updated = chapters.filter((c) => c.id !== chapterId);
  await dbSet(CHAPTERS_KEY, updated);

  // Soft-delete pages belonging to this chapter
  const pages = (await dbGet(PAGES_KEY)) || [];
  const updatedPages = pages.map((p) =>
    p.chapterId === chapterId ? { ...p, isDeleted: true } : p
  );
  await dbSet(PAGES_KEY, updatedPages);

  return updated;
};

// AI Study Notes Operations
export const getChapterAiNotes = async (chapterId) => {
  const chapters = (await dbGet(CHAPTERS_KEY)) || [];
  const target = chapters.find((c) => c.id === chapterId);
  return target?.aiStudyNotes || null;
};

export const saveChapterAiNotes = async (chapterId, notesData) => {
  const chapters = (await dbGet(CHAPTERS_KEY)) || [];
  const index = chapters.findIndex((c) => c.id === chapterId);
  if (index >= 0) {
    chapters[index] = {
      ...chapters[index],
      aiStudyNotes: notesData,
      updatedAt: new Date().toISOString(),
    };
    await dbSet(CHAPTERS_KEY, chapters);
    return chapters[index];
  }
  return null;
};


// Page Operations
export const getPages = async (chapterId = null, includeDeleted = false) => {
  const pages = (await dbGet(PAGES_KEY)) || [];
  let filtered = pages;
  if (!includeDeleted) {
    filtered = filtered.filter((p) => !p.isDeleted);
  }
  if (chapterId) {
    filtered = filtered.filter((p) => p.chapterId === chapterId);
  }
  return filtered.sort((a, b) => (a.pageNo || 0) - (b.pageNo || 0));
};

export const getAllStarredPages = async () => {
  const pages = (await dbGet(PAGES_KEY)) || [];
  return pages.filter((p) => !p.isDeleted && p.isStarred);
};

export const getAllBookmarkedPages = async () => {
  const pages = (await dbGet(PAGES_KEY)) || [];
  return pages.filter((p) => !p.isDeleted && p.isBookmarked);
};

export const getRecycleBinPages = async () => {
  const pages = (await dbGet(PAGES_KEY)) || [];
  return pages.filter((p) => p.isDeleted);
};

export const savePage = async (page) => {
  const pages = (await dbGet(PAGES_KEY)) || [];
  const index = pages.findIndex((p) => p.id === page.id);
  const now = new Date().toISOString();

  if (index >= 0) {
    pages[index] = { ...page, updatedAt: now };
  } else {
    // Determine next page number
    const chapterPages = pages.filter(
      (p) => p.chapterId === page.chapterId && !p.isDeleted
    );
    const nextPageNo = page.pageNo || chapterPages.length + 1;

    pages.push({
      ...page,
      id: page.id || `page-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      pageNo: nextPageNo,
      createdAt: now,
      updatedAt: now,
      isDeleted: false,
    });
  }
  await dbSet(PAGES_KEY, pages);
  return pages;
};

export const saveMultiplePages = async (newPages) => {
  const pages = (await dbGet(PAGES_KEY)) || [];
  const now = new Date().toISOString();

  for (const page of newPages) {
    const chapterPages = pages.filter(
      (p) => p.chapterId === page.chapterId && !p.isDeleted
    );
    const nextPageNo = page.pageNo || chapterPages.length + 1;
    pages.push({
      ...page,
      id: page.id || `page-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      pageNo: nextPageNo,
      createdAt: now,
      updatedAt: now,
      isDeleted: false,
    });
  }

  await dbSet(PAGES_KEY, pages);
  return pages;
};

export const replaceAllPages = async (allPages) => {
  await dbSet(PAGES_KEY, allPages);
  return allPages;
};

export const softDeletePage = async (pageId) => {
  const pages = (await dbGet(PAGES_KEY)) || [];
  const target = pages.find((p) => p.id === pageId);
  if (!target) return pages;

  target.isDeleted = true;
  target.deletedAt = new Date().toISOString();

  // Renumber remaining active pages in the chapter
  const activeChapterPages = pages
    .filter((p) => p.chapterId === target.chapterId && !p.isDeleted)
    .sort((a, b) => a.pageNo - b.pageNo);

  activeChapterPages.forEach((p, idx) => {
    p.pageNo = idx + 1;
  });

  await dbSet(PAGES_KEY, pages);
  return pages;
};

export const restorePage = async (pageId) => {
  const pages = (await dbGet(PAGES_KEY)) || [];
  const target = pages.find((p) => p.id === pageId);
  if (!target) return pages;

  target.isDeleted = false;
  delete target.deletedAt;

  // Append to chapter
  const activeChapterPages = pages.filter(
    (p) => p.chapterId === target.chapterId && !p.isDeleted
  );
  target.pageNo = activeChapterPages.length;

  await dbSet(PAGES_KEY, pages);
  return pages;
};

export const permanentlyDeletePage = async (pageId) => {
  const pages = (await dbGet(PAGES_KEY)) || [];
  const updated = pages.filter((p) => p.id !== pageId);
  await dbSet(PAGES_KEY, updated);
  return updated;
};

export const reorderPagesInChapter = async (chapterId, reorderedPageIds) => {
  const pages = (await dbGet(PAGES_KEY)) || [];
  reorderedPageIds.forEach((id, index) => {
    const p = pages.find((page) => page.id === id);
    if (p) {
      p.pageNo = index + 1;
    }
  });
  await dbSet(PAGES_KEY, pages);
  return pages;
};

// Settings
export const getSettings = async () => {
  const s = await dbGet(SETTINGS_KEY);
  const defaults = {
    defaultFilter: 'magic_color',
    autoDetectCorners: true,
    autoOcr: true,
    highQualityPdf: true,
    geminiApiKey: resolveDefaultKey(),
    pinLock: '',
    isPinEnabled: false,
    syncCode: 'SudhaBPSC',
    autoCloudSync: true,
  };
  if (!s) return defaults;
  return {
    ...defaults,
    ...s,
    geminiApiKey: s.geminiApiKey || defaults.geminiApiKey,
    syncCode: (s.syncCode || defaults.syncCode).trim(),
    autoCloudSync: s.autoCloudSync !== undefined ? s.autoCloudSync : defaults.autoCloudSync,
  };
};

export const saveSettings = async (settings) => {
  await dbSet(SETTINGS_KEY, settings);
  return settings;
};

// Export & Import Backup
export const exportCompleteBackup = async () => {
  const subjects = await getSubjects();
  const chapters = await getChapters();
  const pages = (await dbGet(PAGES_KEY)) || [];
  const settings = await getSettings();

  const backupData = {
    version: '1.0.0',
    exportDate: new Date().toISOString(),
    owner: 'Sudha',
    appName: 'Sudha BPSC Notes',
    subjects,
    chapters,
    pages,
    settings: { ...settings, pinLock: '' }, // do not export PIN
  };

  const blob = new Blob([JSON.stringify(backupData, null, 2)], {
    type: 'application/json',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Sudha_BPSC_Notes_Backup_${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
};

export const importBackupData = async (jsonString) => {
  const data = JSON.parse(jsonString);
  if (!data.subjects || !data.chapters || !data.pages) {
    throw new Error('Invalid backup file format');
  }

  await dbSet(SUBJECTS_KEY, data.subjects);
  await dbSet(CHAPTERS_KEY, data.chapters);
  await dbSet(PAGES_KEY, data.pages);
  if (data.settings) {
    const current = await getSettings();
    await dbSet(SETTINGS_KEY, { ...current, ...data.settings });
  }
  return true;
};
