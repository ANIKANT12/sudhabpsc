import React, { useState } from 'react';
import {
  ArrowLeft,
  Plus,
  Download,
  BookOpen,
  Camera,
  Layers,
  ChevronRight,
  Sparkles,
  Tag,
  Clock,
  Trash2,
} from 'lucide-react';

export default function SubjectDetailView({
  subject,
  chapters,
  pages,
  onBack,
  onSelectChapter,
  onOpenScanner,
  onDownloadSubjectPdf,
  onDownloadChapterPdf,
  onCreateChapter,
  onDeleteSubject,
}) {
  const [isAddChapterOpen, setIsAddChapterOpen] = useState(false);
  const [newChapterTitle, setNewChapterTitle] = useState('');
  const [newChapterNo, setNewChapterNo] = useState(chapters.length + 1);
  const [newChapterDesc, setNewChapterDesc] = useState('');
  const [newChapterTags, setNewChapterTags] = useState('BPSC, Prelims');

  const activePages = pages.filter((p) => !p.isDeleted);
  const subjectChapters = chapters.filter((c) => c.subjectId === subject.id);

  const handleAddChapterSubmit = (e) => {
    e.preventDefault();
    if (!newChapterTitle.trim()) return;

    const tagsArray = newChapterTags
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    onCreateChapter({
      subjectId: subject.id,
      title: newChapterTitle.trim(),
      chapterNo: parseInt(newChapterNo, 10) || subjectChapters.length + 1,
      description: newChapterDesc.trim(),
      tags: tagsArray.length > 0 ? tagsArray : ['BPSC'],
    });

    setNewChapterTitle('');
    setNewChapterDesc('');
    setIsAddChapterOpen(false);
  };

  return (
    <div className="space-y-6 pb-20 animate-in fade-in duration-200">
      {/* Top Breadcrumb */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to All Subjects</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onDownloadSubjectPdf(subject)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-emerald-500/30 text-xs sm:text-sm font-semibold rounded-xl transition-all"
          >
            <Download className="w-4 h-4" />
            <span>Download Full Subject PDF</span>
          </button>

          <button
            onClick={() => onOpenScanner(subject.id)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs sm:text-sm font-semibold rounded-xl shadow-lg shadow-blue-600/30 transition-all active:scale-95"
          >
            <Camera className="w-4 h-4" />
            <span>Scan to Subject</span>
          </button>

          {onDeleteSubject && (
            <button
              onClick={() => {
                if (
                  confirm(
                    `Are you sure you want to delete the entire subject "${subject.title}"? All chapters and scanned pages inside will be moved to the Recycle Bin.`
                  )
                ) {
                  onDeleteSubject(subject.id);
                }
              }}
              className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-colors"
              title="Delete Subject"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Subject Header Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-slate-900 to-slate-800 border border-slate-700 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center text-3xl shadow-inner">
            {subject.icon || '📖'}
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
              {subject.title}
            </h2>
            <p className="text-xs sm:text-sm text-amber-400 font-semibold mt-0.5">
              {subject.hindiTitle}
            </p>
            <p className="text-xs text-slate-400 mt-1 max-w-xl">
              {subject.description}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 border-t md:border-t-0 md:border-l border-slate-700 pt-3 md:pt-0 md:pl-6">
          <div>
            <div className="text-2xl font-black text-white">
              {subjectChapters.length}
            </div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Chapters
            </div>
          </div>
        </div>
      </div>

      {/* Chapters Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
          <span>Chapters in this Subject</span>
          <span className="text-xs px-2.5 py-0.5 bg-slate-800 text-slate-400 rounded-full font-mono border border-slate-700">
            {subjectChapters.length}
          </span>
        </h3>

        <button
          onClick={() => {
            setNewChapterNo(subjectChapters.length + 1);
            setIsAddChapterOpen(true);
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-blue-400 border border-slate-700 rounded-xl text-xs font-semibold transition-all"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Chapter</span>
        </button>
      </div>

      {/* Chapter Cards */}
      {subjectChapters.length === 0 ? (
        <div className="p-12 rounded-3xl border-2 border-dashed border-slate-800 bg-slate-900/40 text-center space-y-4">
          <BookOpen className="w-12 h-12 text-slate-600 mx-auto" />
          <div>
            <h4 className="text-base font-bold text-white">No chapters created yet</h4>
            <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
              Add your first chapter (e.g. Chapter 1: Ancient Magadha & Mauryan Empire)
              and begin scanning your notes!
            </p>
          </div>
          <button
            onClick={() => setIsAddChapterOpen(true)}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs sm:text-sm rounded-xl shadow-lg"
          >
            Create Chapter 1
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {subjectChapters.map((chap) => {
            const chapPages = activePages.filter(
              (p) => p.chapterId === chap.id
            );

            return (
              <div
                key={chap.id}
                className="bg-slate-900/90 border border-slate-800 hover:border-blue-500/50 rounded-2xl p-5 shadow-lg transition-all flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-blue-600/20 text-blue-400 border border-blue-500/30">
                        Chapter {chap.chapterNo || 1}
                      </span>
                      <h4 className="text-base font-bold text-white group-hover:text-blue-400 transition-colors mt-2">
                        {chap.title}
                      </h4>
                    </div>

                    <div className="text-right">
                      <span className="text-xs font-bold text-amber-400">
                        {chapPages.length}{' '}
                        {chapPages.length === 1 ? 'Page' : 'Pages'}
                      </span>
                    </div>
                  </div>

                  {chap.description && (
                    <p className="text-xs text-slate-400 mt-2 line-clamp-2">
                      {chap.description}
                    </p>
                  )}

                  <div className="flex items-center gap-1.5 flex-wrap mt-3">
                    {chap.tags?.map((tag, tIdx) => (
                      <span
                        key={tIdx}
                        className="text-[10px] bg-slate-800 border border-slate-700/80 text-slate-400 px-2 py-0.5 rounded-md"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onOpenScanner(subject.id, chap.id)}
                      className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
                      title="Add Pages to this Chapter"
                    >
                      <Camera className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onDownloadChapterPdf(chap, subject, chapPages)}
                      disabled={chapPages.length === 0}
                      className="p-1.5 text-emerald-400 hover:text-emerald-300 disabled:opacity-30 rounded-lg hover:bg-slate-800 transition-colors"
                      title="Download Chapter PDF"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                  </div>

                  <button
                    onClick={() => onSelectChapter(chap)}
                    className="px-3.5 py-1.5 bg-blue-600/20 hover:bg-blue-600 text-blue-300 hover:text-white border border-blue-500/30 rounded-xl text-xs font-semibold flex items-center gap-1 transition-all"
                  >
                    <span>Review Pages ({chapPages.length})</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Chapter Modal */}
      {isAddChapterOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl text-white">
            <h3 className="text-lg font-bold text-white mb-1">
              Add New Chapter
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Subject: {subject.title}
            </p>

            <form onSubmit={handleAddChapterSubmit} className="space-y-4">
              <div className="grid grid-cols-4 gap-3">
                <div className="col-span-1">
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Ch. No.
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={newChapterNo}
                    onChange={(e) => setNewChapterNo(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div className="col-span-3">
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Chapter Title *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Champaran Satyagraha & Gandhi"
                    value={newChapterTitle}
                    onChange={(e) => setNewChapterTitle(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Chapter Description / Sub-topics
                </label>
                <input
                  type="text"
                  placeholder="e.g. Tinkathia system, Raj Kumar Shukla, Inquiry Committee"
                  value={newChapterDesc}
                  onChange={(e) => setNewChapterDesc(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Tags (Comma separated)
                </label>
                <input
                  type="text"
                  placeholder="BPSC, Prelims, Modern History, Champaran"
                  value={newChapterTags}
                  onChange={(e) => setNewChapterTags(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddChapterOpen(false)}
                  className="px-4 py-2 text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs rounded-xl shadow-lg"
                >
                  Save Chapter
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
