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
  const [newChapterTags, setNewChapterTags] = useState('BPSC, प्रारंभिक परीक्षा');

  const activePages = pages.filter((p) => !p.isDeleted);
  const subjectChapters = chapters.filter((c) => c.subjectId === subject.id);

  const displayTitle = subject.hindiTitle || subject.title;
  const displaySubtitle = subject.englishTitle || (subject.hindiTitle !== subject.title ? subject.title : '');

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
      hindiTitle: newChapterTitle.trim(),
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
          <span>सभी विषयों पर वापस</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onDownloadSubjectPdf(subject)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-emerald-500/30 text-xs sm:text-sm font-semibold rounded-xl transition-all"
            title="सम्पूर्ण विषय की संयुक्त PDF डाउनलोड करें"
          >
            <Download className="w-4 h-4" />
            <span>सम्पूर्ण विषय PDF</span>
          </button>

          <button
            onClick={() => onOpenScanner(subject.id)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs sm:text-sm font-semibold rounded-xl shadow-lg shadow-blue-600/30 transition-all active:scale-95"
          >
            <Camera className="w-4 h-4" />
            <span>नोट्स स्कैन करें</span>
          </button>

          {onDeleteSubject && (
            <button
              onClick={() => {
                if (
                  confirm(
                    `क्या आप वाकई सम्पूर्ण विषय "${displayTitle}" हटाना चाहते हैं? इसके सभी अध्याय और पृष्ठ रीसायकल बिन में चले जाएंगे।`
                  )
                ) {
                  onDeleteSubject(subject.id);
                }
              }}
              className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-colors"
              title="विषय हटाएं"
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
              {displayTitle}
            </h2>
            {displaySubtitle && (
              <p className="text-xs sm:text-sm text-slate-400 font-medium mt-0.5">
                {displaySubtitle}
              </p>
            )}
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
              कुल अध्याय
            </div>
          </div>
        </div>
      </div>

      {/* Chapters Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
          <span>इस विषय के अध्याय</span>
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
          <span>नया अध्याय जोड़ें</span>
        </button>
      </div>

      {/* Chapter Cards */}
      {subjectChapters.length === 0 ? (
        <div className="p-12 rounded-3xl border-2 border-dashed border-slate-800 bg-slate-900/40 text-center space-y-4">
          <BookOpen className="w-12 h-12 text-slate-600 mx-auto" />
          <div>
            <h4 className="text-base font-bold text-white">कोई अध्याय नहीं बनाया गया</h4>
            <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
              पहला अध्याय बनाएं (उदा. अध्याय 1: 1857 का विद्रोह एवं कुंवर सिंह) और अपने हस्तलिखित नोट्स स्कैन करना प्रारंभ करें!
            </p>
          </div>
          <button
            onClick={() => setIsAddChapterOpen(true)}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs sm:text-sm rounded-xl shadow-lg"
          >
            अध्याय 1 बनाएं
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
                        अध्याय {chap.chapterNo || 1}
                      </span>
                      <h4 className="text-base font-bold text-white group-hover:text-blue-400 transition-colors mt-2">
                        {chap.hindiTitle || chap.title}
                      </h4>
                    </div>

                    <div className="text-right">
                      <span className="text-xs font-bold text-amber-400">
                        {chapPages.length} पृष्ठ
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
                      title="इस अध्याय में पृष्ठ जोड़ें"
                    >
                      <Camera className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onDownloadChapterPdf(chap, subject, chapPages)}
                      disabled={chapPages.length === 0}
                      className="p-1.5 text-emerald-400 hover:text-emerald-300 disabled:opacity-30 rounded-lg hover:bg-slate-800 transition-colors"
                      title="अध्याय PDF डाउनलोड करें"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                  </div>

                  <button
                    onClick={() => onSelectChapter(chap)}
                    className="px-3.5 py-1.5 bg-blue-600/20 hover:bg-blue-600 text-blue-300 hover:text-white border border-blue-500/30 rounded-xl text-xs font-semibold flex items-center gap-1 transition-all"
                  >
                    <span>पृष्ठ देखें ({chapPages.length})</span>
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
              नया अध्याय जोड़ें
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              विषय: {displayTitle}
            </p>

            <form onSubmit={handleAddChapterSubmit} className="space-y-4">
              <div className="grid grid-cols-4 gap-3">
                <div className="col-span-1">
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    संख्या
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
                    अध्याय का नाम (हिंदी में) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="उदा. चंपारण सत्याग्रह एवं गांधी जी"
                    value={newChapterTitle}
                    onChange={(e) => setNewChapterTitle(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  अध्याय विवरण / मुख्य बिंदु
                </label>
                <input
                  type="text"
                  placeholder="उदा. तिनकठिया प्रणाली, राजकुमार शुक्ल, जांच समिति"
                  value={newChapterDesc}
                  onChange={(e) => setNewChapterDesc(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  टैग (अल्पविराम से अलग करें)
                </label>
                <input
                  type="text"
                  placeholder="BPSC, प्रारंभिक परीक्षा, आधुनिक इतिहास, चंपारण"
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
                  रद्द करें
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs rounded-xl shadow-lg"
                >
                  अध्याय सहेजें
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
