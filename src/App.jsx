import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import BottomNav from './components/BottomNav';
import SubjectGrid from './components/SubjectGrid';
import SubjectDetailView from './components/SubjectDetailView';
import ChapterView from './components/ChapterView';
import ScannerModal from './components/ScannerModal';
import PageViewerModal from './components/PageViewerModal';
import PdfExportModal from './components/PdfExportModal';
import AiAssistantModal from './components/AiAssistantModal';
import SearchModal from './components/SearchModal';
import RecycleBinModal from './components/RecycleBinModal';
import SettingsModal from './components/SettingsModal';
import StarredNotesView from './components/StarredNotesView';
import PinLockScreen from './components/PinLockScreen';
import InstallAppBanner from './components/InstallAppBanner';

import {
  initStorage,
  getSubjects,
  getChapters,
  getPages,
  getSettings,
  saveSubject,
  saveChapter,
  savePage,
  softDeletePage,
  restorePage,
  permanentlyDeletePage,
  reorderPagesInChapter,
  saveSettings,
  deleteChapter,
  deleteSubject,
} from './services/storage';

import { downloadSubjectPDF, downloadAllNotesZip } from './utils/pdfGenerator';
import {
  syncWithCloud,
  pushSinglePageToCloud,
  deletePageFromCloud,
  pushMetadataToCloud,
  subscribeSyncStatus,
} from './services/syncService';

export default function App() {
  const [loading, setLoading] = useState(true);
  const [subjects, setSubjects] = useState([]);
  const [chapters, setChapters] = useState([]);
  const [pages, setPages] = useState([]);
  const [settings, setSettings] = useState({});
  const [syncState, setSyncState] = useState({
    status: 'idle',
    lastSyncedAt: null,
    error: null,
  });

  // Navigation state
  const [activeTab, setActiveTab] = useState('home'); // 'home' | 'subjects' | 'starred' | 'bookmarks' | 'ai'
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [selectedChapter, setSelectedChapter] = useState(null);

  // Security Lock
  const [isUnlocked, setIsUnlocked] = useState(true);

  // Modals state
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [scannerSubjectId, setScannerSubjectId] = useState(null);
  const [scannerChapterId, setScannerChapterId] = useState(null);

  const [isPageViewerOpen, setIsPageViewerOpen] = useState(false);
  const [viewingPage, setViewingPage] = useState(null);
  const [viewingPagesList, setViewingPagesList] = useState([]);
  const [viewingPageIndex, setViewingPageIndex] = useState(0);

  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);
  const [pdfChapter, setPdfChapter] = useState(null);
  const [pdfSubject, setPdfSubject] = useState(null);
  const [pdfPages, setPdfPages] = useState([]);

  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [aiChapter, setAiChapter] = useState(null);
  const [aiSubject, setAiSubject] = useState(null);
  const [aiPages, setAiPages] = useState([]);

  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isRecycleBinOpen, setIsRecycleBinOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Subscribe to live sync status changes
  useEffect(() => {
    const unsubscribe = subscribeSyncStatus((st) => setSyncState(st));
    return () => unsubscribe();
  }, []);

  // Trigger Cloud Synchronization
  const handleTriggerSync = async () => {
    try {
      const res = await syncWithCloud();
      if (res?.pages) {
        setPages(res.pages);
        if (res.subjects) setSubjects(res.subjects);
        if (res.chapters) setChapters(res.chapters);
      }
      return res;
    } catch (err) {
      console.warn('Manual sync error:', err);
    }
  };

  // Load Initial Data with safe fallback
  const refreshData = async () => {
    setLoading(true);
    try {
      await initStorage();
      const loadedSubjects = await getSubjects();
      const loadedChapters = await getChapters();
      const loadedPages = await getPages(null, true);
      const loadedSettings = await getSettings();

      setSubjects(loadedSubjects || []);
      setChapters(loadedChapters || []);
      setPages(loadedPages || []);
      setSettings(loadedSettings || {});

      if (loadedSettings?.isPinEnabled && loadedSettings?.pinLock) {
        setIsUnlocked(false);
      } else {
        setIsUnlocked(true);
      }

      // Two-Way Cloud Synchronization
      if (loadedSettings?.autoCloudSync !== false) {
        if (!loadedPages || loadedPages.length === 0) {
          // New device or computer with no local cache yet:
          // Await cloud sync so notes immediately appear on first load!
          try {
            const res = await syncWithCloud();
            if (res?.pages && res.pages.length > 0) {
              setPages(res.pages);
              if (res.subjects) setSubjects(res.subjects);
              if (res.chapters) setChapters(res.chapters);
            }
          } catch (e) {
            console.warn('Initial cloud sync error:', e);
          }
        } else {
          // If we already have local pages cached, sync in background
          syncWithCloud()
            .then((res) => {
              if (res?.pages) {
                setPages(res.pages);
                if (res.subjects) setSubjects(res.subjects);
                if (res.chapters) setChapters(res.chapters);
              }
            })
            .catch((e) => console.warn('Background initial sync error:', e));
        }
      }
    } catch (err) {
      console.warn('Data load error, loading defaults:', err);
      setIsUnlocked(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshData();
  }, []);

  // Auto-sync when user returns to tab (e.g. phone scan uploaded, switched to PC)
  useEffect(() => {
    const handleSyncOnVisible = () => {
      if (document.visibilityState === 'visible' && settings?.autoCloudSync !== false) {
        handleTriggerSync();
      }
    };
    window.addEventListener('visibilitychange', handleSyncOnVisible);
    window.addEventListener('focus', handleSyncOnVisible);

    // Periodic live sync poll every 15s so phone uploads appear on PC in real-time
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible' && settings?.autoCloudSync !== false) {
        handleTriggerSync();
      }
    }, 15000);

    return () => {
      window.removeEventListener('visibilitychange', handleSyncOnVisible);
      window.removeEventListener('focus', handleSyncOnVisible);
      clearInterval(interval);
    };
  }, [settings?.autoCloudSync, settings?.syncCode]);

  // Global Keyboard Shortcut (Ctrl+K or Cmd+K for search)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSearchOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Handlers for Scanner
  const handleOpenScanner = (subjId = null, chapId = null) => {
    setScannerSubjectId(subjId || selectedSubject?.id || null);
    setScannerChapterId(chapId || selectedChapter?.id || null);
    setIsScannerOpen(true);
  };

  const handleSaveScannedPage = async (pageData, { newSubjectTitle, newChapterTitle }) => {
    let finalSubjectId = pageData.subjectId || subjects[0]?.id || 'subj-history';
    let finalChapterId = pageData.chapterId;

    let targetSubjObj = subjects.find((s) => s.id === finalSubjectId);
    let targetChapObj = chapters.find((c) => c.id === finalChapterId);

    // Handle dynamically created subject
    if (newSubjectTitle) {
      targetSubjObj = {
        id: finalSubjectId,
        title: newSubjectTitle,
        hindiTitle: newSubjectTitle,
        icon: '📘',
        color: 'from-blue-600 to-indigo-800',
        badgeColor: 'bg-blue-100 text-blue-800 border-blue-300',
        description: 'कस्टम BPSC अध्ययन नोटबुक',
      };
      await saveSubject(targetSubjObj);
      setSubjects((prev) => [...prev.filter((s) => s.id !== targetSubjObj.id), targetSubjObj]);
    }

    // Handle dynamically created or missing chapter
    if (newChapterTitle || !targetChapObj) {
      const existingChaps = chapters.filter((c) => c.subjectId === finalSubjectId);
      targetChapObj = {
        id: finalChapterId || `chap-${Date.now()}`,
        subjectId: finalSubjectId,
        chapterNo: existingChaps.length + 1,
        title: newChapterTitle || 'अध्याय 1: हस्तलिखित नोट्स',
        hindiTitle: newChapterTitle || 'अध्याय 1: हस्तलिखित नोट्स',
        tags: ['BPSC', 'हस्तलिखित नोट्स'],
        description: '',
      };
      finalChapterId = targetChapObj.id;
      await saveChapter(targetChapObj);
      setChapters((prev) => [...prev.filter((c) => c.id !== targetChapObj.id), targetChapObj]);
    }

    // Save Page to IndexedDB
    const updatedPages = await savePage({
      ...pageData,
      subjectId: finalSubjectId,
      chapterId: finalChapterId,
    });
    setPages(updatedPages);

    // Immediately open the Chapter Review screen!
    if (targetSubjObj) setSelectedSubject(targetSubjObj);
    if (targetChapObj) setSelectedChapter(targetChapObj);
    setActiveTab('chapter');

    // Background push to Cloud
    if (settings?.autoCloudSync !== false) {
      const savedPageObj = updatedPages.find(
        (p) =>
          p.id === pageData.id ||
          (p.chapterId === finalChapterId && p.originalDataUrl === pageData.originalDataUrl)
      ) || { ...pageData, subjectId: finalSubjectId, chapterId: finalChapterId };
      pushSinglePageToCloud(savedPageObj, settings?.syncCode);
      if (newSubjectTitle || newChapterTitle) {
        pushMetadataToCloud(
          targetSubjObj
            ? [...subjects.filter((s) => s.id !== targetSubjObj.id), targetSubjObj]
            : subjects,
          targetChapObj
            ? [...chapters.filter((c) => c.id !== targetChapObj.id), targetChapObj]
            : chapters,
          settings?.syncCode
        );
      }
    }
  };

  const handleNavigateToChapter = (chapterId) => {
    const targetChapter = chapters.find((c) => c.id === chapterId);
    if (targetChapter) {
      const targetSubject = subjects.find((s) => s.id === targetChapter.subjectId);
      setSelectedSubject(targetSubject || null);
      setSelectedChapter(targetChapter);
      setActiveTab('chapter');
    }
  };

  // Handlers for Chapter Review
  const handleUpdatePage = async (pageId, updates) => {
    const target = pages.find((p) => p.id === pageId);
    if (!target) return;
    const updated = { ...target, ...updates };
    const updatedPages = await savePage(updated);
    setPages(updatedPages);

    if (viewingPage && viewingPage.id === pageId) {
      setViewingPage(updated);
    }

    if (settings?.autoCloudSync !== false) {
      pushSinglePageToCloud(updated, settings?.syncCode);
    }
  };

  const handleDeletePage = async (pageId) => {
    const updatedPages = await softDeletePage(pageId);
    setPages(updatedPages);
    const target = updatedPages.find((p) => p.id === pageId);
    if (target && settings?.autoCloudSync !== false) {
      pushSinglePageToCloud(target, settings?.syncCode);
    }
  };

  const handleRestorePage = async (pageId) => {
    const updatedPages = await restorePage(pageId);
    setPages(updatedPages);
    const target = updatedPages.find((p) => p.id === pageId);
    if (target && settings?.autoCloudSync !== false) {
      pushSinglePageToCloud(target, settings?.syncCode);
    }
  };

  const handlePermanentDeletePage = async (pageId) => {
    const updatedPages = await permanentlyDeletePage(pageId);
    setPages(updatedPages);
    if (settings?.autoCloudSync !== false) {
      deletePageFromCloud(pageId, settings?.syncCode);
    }
  };

  const handleReorderPages = async (chapterId, pageIds) => {
    const updatedPages = await reorderPagesInChapter(chapterId, pageIds);
    setPages(updatedPages);
  };

  const handleDeleteChapter = async (chapterId) => {
    const updated = await deleteChapter(chapterId);
    setChapters(updated);
    setSelectedChapter(null);
    setActiveTab(selectedSubject ? 'subject_detail' : 'home');
    if (settings?.autoCloudSync !== false) {
      pushMetadataToCloud(subjects, updated, settings?.syncCode);
    }
  };

  const handleDeleteSubject = async (subjectId) => {
    const updatedSubjs = await deleteSubject(subjectId);
    setSubjects(updatedSubjs);
    const updatedChaps = await getChapters();
    setChapters(updatedChaps);
    const updatedPages = await getPages(null, true);
    setPages(updatedPages);
    setSelectedSubject(null);
    setActiveTab('home');
    if (settings?.autoCloudSync !== false) {
      pushMetadataToCloud(updatedSubjs, updatedChaps, settings?.syncCode);
    }
  };

  // PDF Handlers
  const handleOpenChapterPdfModal = (chap, subj, chapPages) => {
    setPdfChapter(chap);
    setPdfSubject(subj);
    setPdfPages(chapPages);
    setIsPdfModalOpen(true);
  };

  const handleDownloadFullSubjectPdf = async (subj) => {
    await downloadSubjectPDF(subj, chapters, pages);
  };

  // AI Assistant Handlers
  const handleOpenAiAssistant = (chap, subj, chapPages) => {
    setAiChapter(chap);
    setAiSubject(subj);
    setAiPages(chapPages);
    setIsAiModalOpen(true);
  };

  // Page Viewer
  const handleOpenPageViewer = (page, pageList, index) => {
    setViewingPage(page);
    setViewingPagesList(pageList);
    setViewingPageIndex(index);
    setIsPageViewerOpen(true);
  };

  const handleNavigatePageViewer = (newIndex) => {
    if (newIndex >= 0 && newIndex < viewingPagesList.length) {
      setViewingPageIndex(newIndex);
      setViewingPage(viewingPagesList[newIndex]);
    }
  };

  // Search Jump handler
  const handleSelectSearchResult = (result) => {
    if (!result?.chapter || !result?.page) return;
    const targetSubj =
      result.subject || subjects.find((s) => s.id === result.chapter.subjectId);
    setSelectedSubject(targetSubj || null);
    setSelectedChapter(result.chapter);
    setActiveTab('chapter');
    const chPages = pages.filter(
      (p) => p.chapterId === result.chapter.id && !p.isDeleted
    );
    const pIdx = chPages.findIndex((p) => p.id === result.page.id);
    if (pIdx >= 0) {
      handleOpenPageViewer(result.page, chPages, pIdx);
    }
  };

  // Derived counts
  const activePages = pages.filter((p) => !p.isDeleted);
  const deletedPages = pages.filter((p) => p.isDeleted);
  const starredCount = activePages.filter((p) => p.isStarred).length;
  const bookmarkedCount = activePages.filter((p) => p.isBookmarked).length;

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center text-2xl animate-bounce shadow-xl shadow-blue-500/30">
          📚
        </div>
        <p className="text-sm font-semibold tracking-wide text-slate-400">
          सुधा के BPSC नोट्स लोड हो रहे हैं...
        </p>
      </div>
    );
  }

  // Security Lock Screen
  if (!isUnlocked) {
    return (
      <PinLockScreen
        expectedPin={settings.pinLock}
        onUnlock={() => setIsUnlocked(true)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      {/* Top Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={(tab) => {
          setSelectedChapter(null);
          setSelectedSubject(null);
          setActiveTab(tab);
        }}
        onOpenScanner={() => handleOpenScanner()}
        onOpenSearch={() => setIsSearchOpen(true)}
        onOpenRecycleBin={() => setIsRecycleBinOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenAllDownloads={() => setIsSettingsOpen(true)}
        starredCount={starredCount}
        bookmarkedCount={bookmarkedCount}
        syncState={syncState}
        onTriggerSync={handleTriggerSync}
      />

      {/* PWA Install Banner */}
      <InstallAppBanner />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-24 sm:pb-12">
        {/* VIEW 1: HOME DASHBOARD & SUBJECT GRID */}
        {(activeTab === 'home' || activeTab === 'subjects') && !selectedSubject && !selectedChapter && (
          <SubjectGrid
            subjects={subjects}
            chapters={chapters}
            pages={pages}
            onSelectSubject={(subj) => {
              setSelectedSubject(subj);
              setActiveTab('subject_detail');
            }}
            onOpenPageViewer={handleOpenPageViewer}
            onOpenScanner={handleOpenScanner}
            onOpenSearch={() => setIsSearchOpen(true)}
            onDownloadSubjectPdf={handleDownloadFullSubjectPdf}
            onOpenAllDownloads={() => setIsSettingsOpen(true)}
            onAddNewSubject={async (newSubj) => {
              await saveSubject(newSubj);
              setSubjects((prev) => [...prev, newSubj]);
            }}
          />
        )}

        {/* VIEW 2: SUBJECT DETAIL (CHAPTER LIST) */}
        {activeTab === 'subject_detail' && selectedSubject && !selectedChapter && (
          <SubjectDetailView
            subject={selectedSubject}
            chapters={chapters}
            pages={pages}
            onBack={() => {
              setSelectedSubject(null);
              setActiveTab('home');
            }}
            onSelectChapter={(chap) => {
              setSelectedChapter(chap);
              setActiveTab('chapter');
            }}
            onOpenScanner={(subjId, chapId) => handleOpenScanner(subjId, chapId)}
            onDownloadSubjectPdf={handleDownloadFullSubjectPdf}
            onDownloadChapterPdf={(chap, subj, chPages) =>
              handleOpenChapterPdfModal(chap, subj, chPages)
            }
            onCreateChapter={async (chapData) => {
              const updated = await saveChapter(chapData);
              setChapters(updated);
            }}
            onDeleteSubject={handleDeleteSubject}
          />
        )}

        {/* VIEW 3: CHAPTER REVIEW & PAGE REORDER */}
        {activeTab === 'chapter' && selectedChapter && (
          <ChapterView
            chapter={selectedChapter}
            subject={
              selectedSubject ||
              subjects.find((s) => s.id === selectedChapter.subjectId)
            }
            pages={pages.filter(
              (p) => p.chapterId === selectedChapter.id && !p.isDeleted
            )}
            onBack={() => {
              setSelectedChapter(null);
              setActiveTab(selectedSubject ? 'subject_detail' : 'home');
            }}
            onOpenScanner={(subjId, chapId) => handleOpenScanner(subjId, chapId)}
            onOpenPdfExport={(chap, subj, chPages) =>
              handleOpenChapterPdfModal(chap, subj, chPages)
            }
            onOpenAiAssistant={(chap, subj, chPages) =>
              handleOpenAiAssistant(chap, subj, chPages)
            }
            onOpenPageViewer={handleOpenPageViewer}
            onUpdatePage={handleUpdatePage}
            onDeletePage={handleDeletePage}
            onReorderPages={handleReorderPages}
            onDeleteChapter={handleDeleteChapter}
          />
        )}

        {/* VIEW 4: STARRED & BOOKMARKED NOTES */}
        {(activeTab === 'starred' || activeTab === 'bookmarks') && (
          <StarredNotesView
            type={activeTab}
            subjects={subjects}
            chapters={chapters}
            pages={pages}
            onOpenPageViewer={handleOpenPageViewer}
            onBack={() => setActiveTab('home')}
          />
        )}

        {/* VIEW 5: AI STUDY ASSISTANT DIRECT TAB */}
        {activeTab === 'ai' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="p-6 rounded-3xl bg-gradient-to-r from-purple-950 via-slate-900 to-slate-900 border border-purple-500/30 shadow-xl flex items-center justify-between">
              <div>
                <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
                  <span>🤖 BPSC AI अध्ययन सहायक एवं टेस्ट मास्टर</span>
                </h2>
                <p className="text-xs text-slate-300 mt-1 max-w-xl">
                  किसी भी अध्याय को चुनें — AI सीधे आपके अपलोड किए गए हस्तलिखित नोट्स को पढ़कर त्वरित सारांश, 
                  BPSC पैटर्न पर 20 MCQs और त्वरित रिविजन फ्लैशकार्ड्स तैयार करेगा।
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {chapters.map((chap) => {
                const subj = subjects.find((s) => s.id === chap.subjectId);
                const chPages = pages.filter(
                  (p) => p.chapterId === chap.id && !p.isDeleted
                );
                return (
                  <div
                    key={chap.id}
                    onClick={() => handleOpenAiAssistant(chap, subj, chPages)}
                    className="p-5 bg-slate-900/90 border border-slate-800 hover:border-purple-500/50 rounded-2xl cursor-pointer group shadow-lg transition-all"
                  >
                    <div className="text-[10px] text-purple-400 font-semibold uppercase tracking-wider">
                      {subj?.hindiTitle || subj?.title}
                    </div>
                    <h4 className="text-base font-bold text-white group-hover:text-purple-300 mt-1">
                      {chap.hindiTitle || chap.title}
                    </h4>
                    <p className="text-xs text-slate-400 mt-2">
                      {chPages.length} स्कैन किए गए पृष्ठ (AI अध्ययन हेतु)
                    </p>
                    <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-purple-400 font-semibold">
                      <span>AI अध्ययन शुरू करें</span>
                      <span>→</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </main>

      {/* Mobile Bottom Navigation */}
      <BottomNav
        activeTab={activeTab}
        setActiveTab={(tab) => {
          setSelectedChapter(null);
          setSelectedSubject(null);
          setActiveTab(tab);
        }}
        onOpenScanner={() => handleOpenScanner()}
      />

      {/* CamScanner Scanner Modal */}
      <ScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        subjects={subjects}
        chapters={chapters}
        preselectedSubjectId={scannerSubjectId}
        preselectedChapterId={scannerChapterId}
        onSavePage={handleSaveScannedPage}
        onUpdatePage={handleUpdatePage}
        onNavigateToChapter={handleNavigateToChapter}
      />

      {/* High-Resolution Page Viewer Modal */}
      {isPageViewerOpen && viewingPage && (
        <PageViewerModal
          isOpen={isPageViewerOpen}
          page={viewingPage}
          pages={viewingPagesList}
          currentIndex={viewingPageIndex}
          onClose={() => {
            setIsPageViewerOpen(false);
            setViewingPage(null);
          }}
          onNavigate={handleNavigatePageViewer}
          onUpdatePage={handleUpdatePage}
          onReCrop={(page) => {
            setIsPageViewerOpen(false);
            setViewingPage(null);
            handleOpenScanner(page.subjectId, page.chapterId);
          }}
        />
      )}

      {/* PDF Generation Customizer Modal */}
      <PdfExportModal
        isOpen={isPdfModalOpen}
        onClose={() => setIsPdfModalOpen(false)}
        chapter={pdfChapter}
        subject={pdfSubject}
        pages={pdfPages}
      />

      {/* AI BPSC Assistant Modal */}
      <AiAssistantModal
        isOpen={isAiModalOpen}
        onClose={() => setIsAiModalOpen(false)}
        chapter={aiChapter}
        subject={aiSubject}
        pages={aiPages}
        apiKey={settings?.geminiApiKey}
      />

      {/* Universal Search Modal */}
      <SearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        subjects={subjects}
        chapters={chapters}
        pages={pages}
        onSelectResult={handleSelectSearchResult}
      />

      {/* Recycle Bin Modal */}
      <RecycleBinModal
        isOpen={isRecycleBinOpen}
        onClose={() => setIsRecycleBinOpen(false)}
        deletedPages={deletedPages}
        chapters={chapters}
        subjects={subjects}
        onRestorePage={handleRestorePage}
        onPermanentDeletePage={handlePermanentDeletePage}
      />

      {/* Settings & Backup Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onSaveSettings={async (newSettings) => {
          await saveSettings(newSettings);
          setSettings(newSettings);
          if (newSettings?.syncCode !== settings?.syncCode) {
            handleTriggerSync();
          }
        }}
        subjects={subjects}
        chapters={chapters}
        pages={pages}
        onDataResetOrImported={refreshData}
        syncState={syncState}
        onManualSync={handleTriggerSync}
      />
    </div>
  );
}
