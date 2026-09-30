import React, { useState } from 'react';
import {
  ArrowLeft,
  Camera,
  Download,
  Sparkles,
  Trash2,
  Star,
  Bookmark,
  RotateCw,
  Sliders,
  ChevronLeft,
  ChevronRight,
  Eye,
  Plus,
  Tag,
  Clock,
  CheckCircle2,
} from 'lucide-react';
import { rotateCanvas, applyFilter, loadImage } from '../utils/imageProcessor';

export default function ChapterView({
  chapter,
  subject,
  pages,
  onBack,
  onOpenScanner,
  onOpenPdfExport,
  onOpenAiAssistant,
  onOpenPageViewer,
  onUpdatePage,
  onDeletePage,
  onReorderPages,
  onDeleteChapter,
}) {
  const [activePageActionId, setActivePageActionId] = useState(null);

  const subjectTitle = subject?.hindiTitle || subject?.title || 'विषय';
  const chapterTitle = chapter?.hindiTitle || chapter?.title;

  // Move page left
  const movePageLeft = (index) => {
    if (index <= 0) return;
    const newPages = [...pages];
    const temp = newPages[index - 1];
    newPages[index - 1] = newPages[index];
    newPages[index - 1].pageNo = index;
    temp.pageNo = index + 1;
    newPages[index] = temp;
    onReorderPages(chapter.id, newPages.map((p) => p.id));
  };

  // Move page right
  const movePageRight = (index) => {
    if (index >= pages.length - 1) return;
    const newPages = [...pages];
    const temp = newPages[index + 1];
    newPages[index + 1] = newPages[index];
    newPages[index + 1].pageNo = index + 2;
    temp.pageNo = index + 1;
    newPages[index] = temp;
    onReorderPages(chapter.id, newPages.map((p) => p.id));
  };

  // Rotate a page 90 degrees
  const handleRotatePage = async (page) => {
    const nextRot = ((page.rotation || 0) + 90) % 360;
    try {
      const img = await loadImage(page.processedDataUrl || page.originalDataUrl);

      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      canvas.getContext('2d').drawImage(img, 0, 0);

      const rotated = rotateCanvas(canvas, 90);
      const newUrl = rotated.toDataURL('image/jpeg', 0.92);

      onUpdatePage(page.id, {
        processedDataUrl: newUrl,
        rotation: nextRot,
      });
    } catch (e) {
      console.error('Rotate page error:', e);
    }
  };

  // Toggle Starred
  const handleToggleStar = (page) => {
    onUpdatePage(page.id, {
      isStarred: !page.isStarred,
    });
  };

  // Toggle Bookmark
  const handleToggleBookmark = (page) => {
    onUpdatePage(page.id, {
      isBookmarked: !page.isBookmarked,
    });
  };

  return (
    <div className="space-y-6 pb-20 animate-in fade-in duration-200">
      {/* Top Navigation & Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{subjectTitle} पर वापस</span>
        </button>

        {/* Action Header Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => onOpenScanner(chapter.subjectId, chapter.id)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs sm:text-sm font-semibold rounded-xl shadow-md transition-all active:scale-95"
          >
            <Camera className="w-4 h-4" />
            <span>और पृष्ठ जोड़ें</span>
          </button>

          <button
            onClick={() => onOpenPdfExport(chapter, subject, pages)}
            disabled={pages.length === 0}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-emerald-400 border border-emerald-500/30 text-xs sm:text-sm font-semibold rounded-xl transition-all"
            title="इस अध्याय की रंगीन PDF बनाएं"
          >
            <Download className="w-4 h-4" />
            <span>अध्याय PDF डाउनलोड</span>
          </button>

          <button
            onClick={() => onOpenAiAssistant(chapter, subject, pages)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/30 text-xs sm:text-sm font-semibold rounded-xl transition-all"
            title="अपलोड किए गए नोट्स पर आधारित AI अध्ययन एवं MCQ"
          >
            <Sparkles className="w-4 h-4 text-purple-400" />
            <span>AI अध्ययन एवं रिविजन</span>
          </button>

          <button
            onClick={() => {
              if (
                confirm(
                  `क्या आप वाकई अध्याय "${chapterTitle}" हटाना चाहते हैं? इसके स्कैन किए गए पृष्ठ रीसायकल बिन में चले जाएंगे।`
                )
              ) {
                onDeleteChapter(chapter.id);
              }
            }}
            className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-colors"
            title="अध्याय हटाएं"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Chapter Information Banner */}
      <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-r from-slate-900 to-slate-800 border border-slate-700/80 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider bg-blue-500/20 text-blue-300 border border-blue-500/30 rounded-full">
                अध्याय {chapter.chapterNo || 1}
              </span>
              <span className="text-xs text-slate-400">
                {subjectTitle}
              </span>
            </div>

            <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
              {chapterTitle}
            </h2>

            {chapter.description && (
              <p className="text-xs sm:text-sm text-slate-300 mt-1.5 max-w-2xl">
                {chapter.description}
              </p>
            )}

            {/* Tags */}
            <div className="flex items-center gap-1.5 flex-wrap mt-3">
              {chapter.tags?.map((t, idx) => (
                <span
                  key={idx}
                  className="px-2 py-0.5 bg-slate-800/80 border border-slate-700 text-slate-300 rounded-md text-[11px] font-medium flex items-center gap-1"
                >
                  <Tag className="w-2.5 h-2.5 text-blue-400" />
                  {t}
                </span>
              ))}
            </div>
          </div>

          {/* Quick stats counter */}
          <div className="flex sm:flex-col items-center sm:items-end justify-between border-t sm:border-t-0 sm:border-l border-slate-700/80 pt-3 sm:pt-0 sm:pl-6 gap-2">
            <div className="text-left sm:text-right">
              <div className="text-2xl sm:text-3xl font-black text-amber-400">
                {pages.length}
              </div>
              <div className="text-[11px] uppercase font-bold text-slate-400 tracking-wider">
                {pages.length === 1 ? 'पृष्ठ स्कैन' : 'कुल पृष्ठ स्कैन'}
              </div>
            </div>

            <div className="text-[11px] text-slate-400 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              <span>
                अपडेटेड:{' '}
                {new Date(chapter.updatedAt || Date.now()).toLocaleDateString('hi-IN')}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Pages Grid Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-white">अध्याय के पृष्ठ</h3>
            <span className="text-xs text-slate-400 font-medium">
              (PDF हेतु पृष्ठों का क्रम बदलने के लिए तीरों का उपयोग करें)
            </span>
          </div>

          <button
            onClick={() => onOpenScanner(chapter.subjectId, chapter.id)}
            className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 font-semibold"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>नया पृष्ठ जोड़ें</span>
          </button>
        </div>

        {pages.length === 0 ? (
          <div className="p-12 rounded-3xl border-2 border-dashed border-slate-800 bg-slate-900/50 flex flex-col items-center justify-center text-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center justify-center">
              <Camera className="w-8 h-8" />
            </div>
            <div>
              <h4 className="text-base font-bold text-white">अभी तक कोई पृष्ठ स्कैन नहीं किया गया</h4>
              <p className="text-xs text-slate-400 max-w-sm mt-1">
                इस अध्याय के अपने हस्तलिखित नोट्स की फोटो खींचें या गैलरी से अपलोड करें।
                स्कैनर स्वचालित रूप से पृष्ठ को सीधा, साफ व रंगीन करेगा!
              </p>
            </div>
            <button
              onClick={() => onOpenScanner(chapter.subjectId, chapter.id)}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs sm:text-sm rounded-xl shadow-lg shadow-blue-600/30 flex items-center gap-2"
            >
              <Camera className="w-4 h-4" />
              <span>अभी पृष्ठ 1 स्कैन करें</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {pages.map((page, index) => (
              <div
                key={page.id}
                className="group relative bg-slate-900 border border-slate-800 hover:border-blue-500/50 rounded-2xl overflow-hidden shadow-lg transition-all flex flex-col"
              >
                {/* Page Number & Badge */}
                <div className="p-2.5 bg-slate-900/90 border-b border-slate-800/80 flex items-center justify-between z-10">
                  <div className="flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-md bg-blue-600/20 text-blue-400 border border-blue-500/30 text-[11px] font-extrabold flex items-center justify-center">
                      {index + 1}
                    </span>
                    <span className="text-[11px] font-semibold text-slate-300">
                      पृष्ठ {page.pageNo || index + 1}
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleToggleStar(page)}
                      className={`p-1 rounded-md transition-colors ${
                        page.isStarred
                          ? 'text-amber-400 bg-amber-400/20'
                          : 'text-slate-500 hover:text-amber-400'
                      }`}
                      title={page.isStarred ? 'महत्वपूर्ण (Starred)' : 'महत्वपूर्ण मार्क करें'}
                    >
                      <Star className="w-3.5 h-3.5 fill-current" />
                    </button>
                    <button
                      onClick={() => handleToggleBookmark(page)}
                      className={`p-1 rounded-md transition-colors ${
                        page.isBookmarked
                          ? 'text-blue-400 bg-blue-400/20'
                          : 'text-slate-500 hover:text-blue-400'
                      }`}
                      title="बुकमार्क करें"
                    >
                      <Bookmark className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Thumbnail Preview (Clickable to open high-res viewer) */}
                <div
                  onClick={() => onOpenPageViewer(page, pages, index)}
                  className="relative aspect-[3/4] bg-slate-950 cursor-pointer overflow-hidden flex items-center justify-center p-2 group"
                >
                  <img
                    src={page.processedDataUrl || page.originalDataUrl}
                    alt={`पृष्ठ ${index + 1}`}
                    className="w-full h-full object-contain rounded shadow transition-transform duration-200 group-hover:scale-[1.02]"
                    loading="lazy"
                  />

                  {/* Hover Overlay with Eye icon */}
                  <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-2 transition-opacity">
                    <span className="px-3 py-1.5 rounded-xl bg-blue-600 text-white text-xs font-semibold shadow-lg flex items-center gap-1.5">
                      <Eye className="w-3.5 h-3.5" />
                      <span>देखें</span>
                    </span>
                  </div>

                  {/* OCR indicator tag */}
                  {page.ocrText && (
                    <div className="absolute bottom-2 left-2 bg-slate-900/80 backdrop-blur-sm px-1.5 py-0.5 rounded text-[9px] text-emerald-300 border border-emerald-500/30 font-medium">
                      OCR तैयार
                    </div>
                  )}
                </div>

                {/* Bottom Quick Tools */}
                <div className="p-2 bg-slate-900 border-t border-slate-800/80 flex items-center justify-between text-slate-400">
                  {/* Left / Right arrows to reorder */}
                  <div className="flex items-center gap-0.5">
                    <button
                      onClick={() => movePageLeft(index)}
                      disabled={index === 0}
                      className="p-1 hover:text-white disabled:opacity-20 transition-colors"
                      title="पृष्ठ बाएं खिसकाएं"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => movePageRight(index)}
                      disabled={index === pages.length - 1}
                      className="p-1 hover:text-white disabled:opacity-20 transition-colors"
                      title="पृष्ठ दाएं खिसकाएं"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Rotate */}
                  <button
                    onClick={() => handleRotatePage(page)}
                    className="p-1 hover:text-white transition-colors"
                    title="90° घुमाएं"
                  >
                    <RotateCw className="w-3.5 h-3.5" />
                  </button>

                  {/* Delete */}
                  <button
                    onClick={() => {
                      if (confirm(`क्या आप पृष्ठ ${index + 1} को रीसायकल बिन में भेजना चाहते हैं?`)) {
                        onDeletePage(page.id);
                      }
                    }}
                    className="p-1 hover:text-red-400 transition-colors"
                    title="रीसायकल बिन में भेजें"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
