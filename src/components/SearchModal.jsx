import React, { useState, useMemo } from 'react';
import {
  X,
  Search,
  FileText,
  Bookmark,
  BookOpen,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { searchNotesIndex } from '../services/ocrService';

export default function SearchModal({
  isOpen,
  onClose,
  subjects,
  chapters,
  pages,
  onSelectResult,
}) {
  if (!isOpen) return null;

  const [query, setQuery] = useState('');

  const searchResults = useMemo(() => {
    return searchNotesIndex(query, subjects, chapters, pages);
  }, [query, subjects, chapters, pages]);

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-3 sm:p-6 pt-16 sm:pt-20 bg-slate-950/80 backdrop-blur-md overflow-hidden text-white animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl flex flex-col max-h-[80vh] overflow-hidden">
        {/* Search Input Bar */}
        <div className="p-4 border-b border-slate-800 flex items-center gap-3 bg-slate-900/90">
          <Search className="w-5 h-5 text-blue-400 shrink-0" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="नोट्स, अध्याय, विषय या हस्तलिखित कॉपियों के शब्द खोजें (उदा. 1857 क्रांति, चंपारण, संविधान)..."
            className="flex-1 bg-transparent border-none text-white text-sm focus:outline-none placeholder-slate-500"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="text-xs text-slate-500 hover:text-slate-300"
            >
              हटाएं
            </button>
          )}
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 ml-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Results List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {!query.trim() ? (
            <div className="py-12 text-center text-slate-500 space-y-3">
              <Search className="w-8 h-8 mx-auto text-slate-600" />
              <p className="text-xs">
                खोजने के लिए किसी BPSC विषय, व्यक्तित्व, अनुच्छेद या हस्तलिखित शब्द को लिखें।
              </p>
              <div className="flex flex-wrap justify-center gap-2 pt-2">
                {['1857 क्रांति', 'चंपारण सत्याग्रह', 'मौलिक अधिकार', 'बिहार विशेष', 'प्रीलिम्स', 'मेन्स'].map(
                  (tag) => (
                    <button
                      key={tag}
                      onClick={() => setQuery(tag)}
                      className="px-2.5 py-1 rounded-full bg-slate-800 hover:bg-slate-700 text-[11px] text-slate-300 border border-slate-700 transition-colors"
                    >
                      {tag}
                    </button>
                  )
                )}
              </div>
            </div>
          ) : searchResults.length === 0 ? (
            <div className="py-12 text-center text-slate-500">
              <p className="text-sm font-semibold">"{query}" के लिए कोई नोट नहीं मिला</p>
              <p className="text-xs text-slate-400 mt-1">
                कृपया कोई अन्य शब्द खोजें अथवा सुनिश्चित करें कि पृष्ठ का OCR स्कैन किया गया है।
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-1">
                {searchResults.length} परिणाम मिले
              </div>

              {searchResults.map((item, idx) => (
                <div
                  key={idx}
                  onClick={() => {
                    onSelectResult(item);
                    onClose();
                  }}
                  className="p-3.5 bg-slate-800/60 hover:bg-slate-800 border border-slate-700/70 hover:border-blue-500/50 rounded-2xl flex items-center justify-between gap-4 cursor-pointer transition-all group"
                >
                  <div className="flex items-center gap-3">
                    {/* Thumbnail preview */}
                    <div className="w-12 h-14 bg-slate-950 rounded-lg overflow-hidden shrink-0 border border-slate-700 flex items-center justify-center">
                      <img
                        src={
                          item.page.processedDataUrl || item.page.originalDataUrl
                        }
                        alt="Page preview"
                        className="w-full h-full object-cover"
                      />
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white group-hover:text-blue-400 transition-colors">
                          {item.chapter?.hindiTitle || item.chapter?.title}
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 font-mono">
                          पृष्ठ {item.page.pageNo || 1}
                        </span>
                      </div>

                      <div className="text-[11px] text-slate-400 mt-0.5">
                        {item.subject?.hindiTitle || item.subject?.title}
                      </div>

                      {item.snippet && (
                        <p className="text-xs text-amber-300/90 font-mono bg-slate-900/60 px-2 py-0.5 rounded mt-1.5 line-clamp-1 border border-slate-800">
                          {item.snippet}
                        </p>
                      )}
                    </div>
                  </div>

                  <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-white transition-colors" />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
