import React, { useState } from 'react';
import {
  BookOpen,
  Camera,
  Download,
  Plus,
  ChevronRight,
  FolderPlus,
  Sparkles,
  Layers,
  FileText,
  Star,
  Search,
} from 'lucide-react';

export default function SubjectGrid({
  subjects,
  chapters,
  pages,
  onSelectSubject,
  onOpenScanner,
  onOpenSearch,
  onDownloadSubjectPdf,
  onOpenAllDownloads,
  onAddNewSubject,
}) {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newHindiTitle, setNewHindiTitle] = useState('');
  const [newIcon, setNewIcon] = useState('📘');
  const [newDescription, setNewDescription] = useState('');

  // Calculate statistics
  const totalChapters = chapters.length;
  const activePages = pages.filter((p) => !p.isDeleted);
  const totalPages = activePages.length;
  const starredPages = activePages.filter((p) => p.isStarred).length;

  const handleCreateSubject = (e) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    onAddNewSubject({
      id: `subj-${Date.now()}`,
      title: newTitle.trim(),
      hindiTitle: newHindiTitle.trim() || newTitle.trim(),
      icon: newIcon || '📘',
      description: newDescription.trim() || 'Custom BPSC study notes',
      color: 'from-blue-600 to-indigo-800',
      badgeColor: 'bg-blue-100 text-blue-800 border-blue-300',
    });

    setNewTitle('');
    setNewHindiTitle('');
    setNewDescription('');
    setIsAddModalOpen(false);
  };

  return (
    <div className="space-y-8 pb-20 animate-in fade-in duration-200">
      {/* Hero / Quick Action Banner */}
      <div className="relative rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900 to-blue-950 border border-slate-800 p-6 sm:p-8 shadow-2xl overflow-hidden">
        {/* Glow orb */}
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-80 h-80 bg-blue-600/15 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3 max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/15 border border-blue-500/30 text-blue-300 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Bihar Public Service Commission (BPSC) Prep</span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight leading-tight">
              Sudha's Digital BPSC Notebook
            </h2>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Scan, auto-straighten, and organize handwritten notes. Download
              chapter-wise or full-subject PDFs with automatic table of contents.
            </p>
          </div>

          {/* Large Action Buttons */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <button
              onClick={() => onOpenScanner()}
              className="px-6 py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-sm rounded-2xl shadow-xl shadow-blue-600/30 flex items-center justify-center gap-2.5 active:scale-95 transition-all"
            >
              <Camera className="w-5 h-5" />
              <span>Upload / Scan Notes</span>
            </button>

            <button
              onClick={onOpenSearch}
              className="px-5 py-3.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold text-sm rounded-2xl flex items-center justify-center gap-2 transition-colors"
            >
              <Search className="w-4 h-4 text-slate-400" />
              <span>Search Notes</span>
            </button>
          </div>
        </div>

        {/* Live Counters */}
        <div className="mt-8 pt-6 border-t border-slate-800/80 grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-3 bg-slate-800/50 rounded-2xl border border-slate-700/60">
            <div className="text-2xl sm:text-3xl font-black text-white">
              {subjects.length}
            </div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">
              BPSC Subjects
            </div>
          </div>

          <div className="p-3 bg-slate-800/50 rounded-2xl border border-slate-700/60">
            <div className="text-2xl sm:text-3xl font-black text-blue-400">
              {totalChapters}
            </div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">
              Total Chapters
            </div>
          </div>

          <div className="p-3 bg-slate-800/50 rounded-2xl border border-slate-700/60">
            <div className="text-2xl sm:text-3xl font-black text-amber-400">
              {totalPages}
            </div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">
              Scanned Pages
            </div>
          </div>

          <div className="p-3 bg-slate-800/50 rounded-2xl border border-slate-700/60">
            <div className="text-2xl sm:text-3xl font-black text-emerald-400">
              {starredPages}
            </div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">
              High Yield Notes
            </div>
          </div>
        </div>
      </div>

      {/* Subjects Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
            <span>BPSC Subjects</span>
            <span className="text-xs px-2.5 py-0.5 bg-slate-800 text-slate-400 rounded-full font-mono border border-slate-700">
              {subjects.length}
            </span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Select a subject to view chapters, download subject PDFs, or scan new pages
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-blue-400 border border-slate-700 hover:border-blue-500/40 text-xs sm:text-sm font-semibold rounded-xl transition-all"
        >
          <FolderPlus className="w-4 h-4" />
          <span>New Subject</span>
        </button>
      </div>

      {/* Subjects Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {subjects.map((subj) => {
          const subjChapters = chapters.filter((c) => c.subjectId === subj.id);
          const chIds = new Set(subjChapters.map((c) => c.id));
          const subjPages = activePages.filter((p) => chIds.has(p.chapterId));

          return (
            <div
              key={subj.id}
              className="group bg-slate-900/90 border border-slate-800 hover:border-blue-500/50 rounded-3xl p-5 shadow-lg hover:shadow-xl transition-all flex flex-col justify-between"
            >
              <div>
                {/* Top header & Icon */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-slate-800 to-slate-700 border border-slate-700 flex items-center justify-center text-2xl shadow-inner group-hover:scale-110 transition-transform">
                      {subj.icon || '📖'}
                    </div>
                    <div>
                      <h4 className="text-base font-bold text-white group-hover:text-blue-400 transition-colors">
                        {subj.title}
                      </h4>
                      <p className="text-xs text-amber-400/90 font-medium">
                        {subj.hindiTitle}
                      </p>
                    </div>
                  </div>

                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700/80">
                    {subjChapters.length} Ch.
                  </span>
                </div>

                {/* Description */}
                <p className="text-xs text-slate-400 mt-3 line-clamp-2">
                  {subj.description}
                </p>

                {/* Stats row */}
                <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                  <div className="flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-blue-400" />
                    <span>
                      {subjChapters.length}{' '}
                      {subjChapters.length === 1 ? 'Chapter' : 'Chapters'}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-emerald-400" />
                    <span>
                      {subjPages.length}{' '}
                      {subjPages.length === 1 ? 'Page' : 'Pages'} Scanned
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-5 pt-3 border-t border-slate-800 flex items-center justify-between gap-2">
                <button
                  onClick={() => onDownloadSubjectPdf(subj)}
                  disabled={subjPages.length === 0}
                  className="flex items-center gap-1 text-xs font-semibold text-emerald-400 hover:text-emerald-300 disabled:opacity-30 transition-colors p-1"
                  title="Download All Chapters as One Subject PDF with Table of Contents"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Subject PDF</span>
                </button>

                <button
                  onClick={() => onSelectSubject(subj)}
                  className="px-3.5 py-1.5 bg-blue-600/20 hover:bg-blue-600 text-blue-300 hover:text-white border border-blue-500/30 rounded-xl text-xs font-semibold flex items-center gap-1 transition-all"
                >
                  <span>Open Chapters</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Custom Subject Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl text-white">
            <h3 className="text-lg font-bold text-white mb-1">
              Add New BPSC Subject
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Create a custom subject notebook (e.g. Anthropology, Bihar Economics)
            </p>

            <form onSubmit={handleCreateSubject} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Subject Title (English) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Bihar Geography & Mapping"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Subject Title (Hindi)
                </label>
                <input
                  type="text"
                  placeholder="e.g. बिहार का भूगोल"
                  value={newHindiTitle}
                  onChange={(e) => setNewHindiTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Icon Emoji
                </label>
                <div className="flex gap-2">
                  {['📜', '🏛️', '🌍', '⚖️', '💰', '🔬', '🌿', '📰', '📖', '🎯', '🗺️', '💡'].map(
                    (emoji) => (
                      <button
                        type="button"
                        key={emoji}
                        onClick={() => setNewIcon(emoji)}
                        className={`text-lg p-1.5 rounded-lg border ${
                          newIcon === emoji
                            ? 'bg-blue-600/30 border-blue-500'
                            : 'bg-slate-800 border-slate-700'
                        }`}
                      >
                        {emoji}
                      </button>
                    )
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Short Description
                </label>
                <input
                  type="text"
                  placeholder="e.g. High priority notes for BPSC 70th Prelims"
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs rounded-xl shadow-lg"
                >
                  Create Subject
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
