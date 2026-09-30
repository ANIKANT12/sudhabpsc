import React from 'react';
import { Star, Bookmark, Eye, ArrowLeft, Download } from 'lucide-react';

export default function StarredNotesView({
  type = 'starred', // 'starred' | 'bookmarks'
  subjects,
  chapters,
  pages,
  onOpenPageViewer,
  onBack,
}) {
  const isStarredMode = type === 'starred';
  const filteredPages = pages.filter((p) =>
    isStarredMode ? p.isStarred && !p.isDeleted : p.isBookmarked && !p.isDeleted
  );

  return (
    <div className="space-y-6 pb-20 animate-in fade-in duration-200">
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Dashboard</span>
        </button>

        <span className="text-xs font-semibold px-3 py-1 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
          {filteredPages.length}{' '}
          {isStarredMode ? 'Starred Pages' : 'Bookmarked Pages'}
        </span>
      </div>

      <div className="p-6 rounded-3xl bg-gradient-to-r from-slate-900 to-slate-800 border border-slate-700 shadow-xl flex items-center gap-4">
        <div
          className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shadow-inner ${
            isStarredMode
              ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
              : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
          }`}
        >
          {isStarredMode ? (
            <Star className="w-7 h-7 fill-current" />
          ) : (
            <Bookmark className="w-7 h-7 fill-current" />
          )}
        </div>
        <div>
          <h2 className="text-xl font-extrabold text-white">
            {isStarredMode
              ? 'High Yield / Starred Revision Notes'
              : 'Exam Bookmarks'}
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            {isStarredMode
              ? 'All marked high-yield pages from all BPSC subjects in one place for rapid final revision.'
              : 'Pages you bookmarked with personal notes for quick recall.'}
          </p>
        </div>
      </div>

      {filteredPages.length === 0 ? (
        <div className="p-12 text-center rounded-3xl border-2 border-dashed border-slate-800 bg-slate-900/40 space-y-3">
          {isStarredMode ? (
            <Star className="w-10 h-10 text-slate-600 mx-auto" />
          ) : (
            <Bookmark className="w-10 h-10 text-slate-600 mx-auto" />
          )}
          <h4 className="text-base font-bold text-white">No pages marked yet</h4>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Tap the {isStarredMode ? 'star (★)' : 'bookmark (🔖)'} icon on any scanned note
            to add it to your quick revision list.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {filteredPages.map((page, index) => {
            const chap = chapters.find((c) => c.id === page.chapterId);
            const subj = subjects.find((s) => s.id === page.subjectId);

            return (
              <div
                key={page.id}
                onClick={() => onOpenPageViewer(page, filteredPages, index)}
                className="group relative bg-slate-900 border border-slate-800 hover:border-blue-500/50 rounded-2xl overflow-hidden shadow-lg transition-all flex flex-col cursor-pointer"
              >
                <div className="p-2.5 bg-slate-900/90 border-b border-slate-800/80 flex items-center justify-between z-10">
                  <span className="text-[11px] font-bold text-slate-200 truncate">
                    {chap?.title || 'Note'}
                  </span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 font-mono">
                    P.{page.pageNo || 1}
                  </span>
                </div>

                <div className="relative aspect-[3/4] bg-slate-950 flex items-center justify-center p-2">
                  <img
                    src={page.processedDataUrl || page.originalDataUrl}
                    alt="Page thumbnail"
                    className="w-full h-full object-contain rounded shadow group-hover:scale-[1.02] transition-transform"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                    <span className="px-3 py-1 rounded-xl bg-blue-600 text-white text-xs font-semibold flex items-center gap-1">
                      <Eye className="w-3.5 h-3.5" />
                      <span>View</span>
                    </span>
                  </div>
                </div>

                <div className="p-2 bg-slate-900 text-[10px] text-slate-400 border-t border-slate-800 truncate">
                  {subj?.title || 'BPSC Note'}
                  {page.bookmarkNote && (
                    <div className="text-amber-300 truncate mt-0.5 font-medium">
                      Note: {page.bookmarkNote}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
