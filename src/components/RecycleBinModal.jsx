import React from 'react';
import { X, Trash2, RotateCcw, AlertTriangle } from 'lucide-react';

export default function RecycleBinModal({
  isOpen,
  onClose,
  deletedPages,
  chapters,
  subjects,
  onRestorePage,
  onPermanentDeletePage,
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md overflow-hidden text-white animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-red-500/20 text-red-400 border border-red-500/30">
              <Trash2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">रीसायकल बिन (हटाए गए पृष्ठ)</h3>
              <p className="text-xs text-slate-400">
                {deletedPages.length} हटाए गए पृष्ठ
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {deletedPages.length === 0 ? (
            <div className="py-12 text-center text-slate-500 space-y-2">
              <Trash2 className="w-10 h-10 mx-auto text-slate-700" />
              <p className="text-sm font-semibold text-slate-400">
                रीसायकल बिन खाली है
              </p>
              <p className="text-xs text-slate-500">
                गलती से हटाए गए पृष्ठों को यहाँ से कभी भी पुनर्प्राप्त (Restore) किया जा सकता है।
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {deletedPages.map((page) => {
                const chap = chapters.find((c) => c.id === page.chapterId);
                const subj = subjects.find((s) => s.id === page.subjectId);

                return (
                  <div
                    key={page.id}
                    className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden p-2 flex flex-col justify-between space-y-2"
                  >
                    <div className="aspect-[3/4] bg-black rounded-lg overflow-hidden flex items-center justify-center">
                      <img
                        src={page.processedDataUrl || page.originalDataUrl}
                        alt="Deleted page"
                        className="w-full h-full object-contain opacity-75"
                      />
                    </div>

                    <div className="text-[11px] text-slate-400 truncate">
                      {chap?.hindiTitle || chap?.title || 'अध्याय'}
                    </div>

                    <div className="flex items-center justify-between gap-1 pt-1 border-t border-slate-800">
                      <button
                        onClick={() => onRestorePage(page.id)}
                        className="flex-1 py-1 px-2 bg-blue-600/20 hover:bg-blue-600 text-blue-300 hover:text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition-colors"
                        title="पृष्ठ वापस लाएं"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>वापस लाएं</span>
                      </button>

                      <button
                        onClick={() => {
                          if (
                            confirm(
                              'क्या आप इस पृष्ठ को स्थायी रूप से हटाना चाहते हैं? इसे वापस नहीं लाया जा सकेगा।'
                            )
                          ) {
                            onPermanentDeletePage(page.id);
                          }
                        }}
                        className="p-1 text-slate-500 hover:text-red-400 rounded-lg hover:bg-red-500/10 transition-colors"
                        title="स्थायी रूप से हटाएं"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
