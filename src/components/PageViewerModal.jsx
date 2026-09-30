import React, { useState, useEffect } from 'react';
import {
  X,
  ChevronLeft,
  ChevronRight,
  Star,
  Bookmark,
  RotateCw,
  Copy,
  Check,
  FileText,
  Sliders,
  Image as ImageIcon,
  Sparkles,
  Loader2,
} from 'lucide-react';
import { rotateCanvas, loadImage } from '../utils/imageProcessor';
import { recognizeText } from '../services/ocrService';

export default function PageViewerModal({
  page,
  pages,
  currentIndex,
  onClose,
  onNavigate,
  onUpdatePage,
  onReCrop,
}) {
  if (!page) return null;

  const [viewMode, setViewMode] = useState('processed'); // 'processed' | 'original'
  const [copiedOcr, setCopiedOcr] = useState(false);
  const [ocrText, setOcrText] = useState(page?.ocrText || '');
  const [bookmarkNote, setBookmarkNote] = useState(page?.bookmarkNote || '');
  const [isEditingOcr, setIsEditingOcr] = useState(false);
  const [isOcrRunning, setIsOcrRunning] = useState(false);

  // Synchronize state whenever page changes
  useEffect(() => {
    if (page) {
      setOcrText(page.ocrText || '');
      setBookmarkNote(page.bookmarkNote || '');
      setViewMode('processed');
    }
  }, [page?.id]);

  const totalPages = pages.length;

  const handleCopyOcr = () => {
    if (!ocrText) return;
    navigator.clipboard.writeText(ocrText);
    setCopiedOcr(true);
    setTimeout(() => setCopiedOcr(false), 2000);
  };

  const handleSaveOcrText = () => {
    onUpdatePage(page.id, { ocrText, bookmarkNote });
    setIsEditingOcr(false);
  };

  const handleRunOcr = async () => {
    const src = page.processedDataUrl || page.originalDataUrl;
    if (!src) return;
    setIsOcrRunning(true);
    try {
      const text = await recognizeText(src);
      if (text) {
        setOcrText(text);
        onUpdatePage(page.id, { ocrText: text });
      }
    } catch (e) {
      console.warn('OCR on demand failed:', e);
    } finally {
      setIsOcrRunning(false);
    }
  };

  const handleRotate = async () => {
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
      console.error('Rotate error:', e);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/90 backdrop-blur-md overflow-hidden text-white animate-in fade-in duration-200">
      <div className="w-full max-w-5xl h-[92vh] bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden">
        {/* Top Header */}
        <div className="px-5 py-3.5 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
          <div className="flex items-center gap-3">
            <span className="px-2.5 py-1 bg-blue-600/20 text-blue-400 border border-blue-500/30 rounded-lg text-xs font-bold font-mono">
              Page {currentIndex + 1} / {totalPages}
            </span>

            {/* Toggle Processed vs Original */}
            <div className="flex items-center bg-slate-800 rounded-xl p-0.5 border border-slate-700 text-xs">
              <button
                onClick={() => setViewMode('processed')}
                className={`px-3 py-1 rounded-lg font-medium transition-colors ${
                  viewMode === 'processed'
                    ? 'bg-blue-600 text-white shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                CamScanner Processed
              </button>
              <button
                onClick={() => setViewMode('original')}
                className={`px-3 py-1 rounded-lg font-medium transition-colors ${
                  viewMode === 'original'
                    ? 'bg-blue-600 text-white shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Original Photo
              </button>
            </div>
          </div>

          {/* Quick Toolbar */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              onClick={() =>
                onUpdatePage(page.id, { isStarred: !page.isStarred })
              }
              className={`p-2 rounded-xl transition-colors ${
                page.isStarred
                  ? 'text-amber-400 bg-amber-400/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
              title="Star / High Yield Note"
            >
              <Star className="w-4 h-4 fill-current" />
            </button>

            <button
              onClick={() =>
                onUpdatePage(page.id, { isBookmarked: !page.isBookmarked })
              }
              className={`p-2 rounded-xl transition-colors ${
                page.isBookmarked
                  ? 'text-blue-400 bg-blue-400/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
              title="Bookmark Page"
            >
              <Bookmark className="w-4 h-4" />
            </button>

            <button
              onClick={handleRotate}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title="Rotate 90 degrees"
            >
              <RotateCw className="w-4 h-4" />
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors ml-2"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Main Area: Image on Left/Center, OCR & Notes on Right */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* Main Image Viewport */}
          <div className="flex-1 relative bg-slate-950 flex items-center justify-center p-4 overflow-hidden select-none">
            <img
              src={
                viewMode === 'processed'
                  ? page.processedDataUrl || page.originalDataUrl
                  : page.originalDataUrl
              }
              alt="Note Page Full Resolution"
              className="max-h-full max-w-full object-contain rounded-lg shadow-2xl transition-all"
            />

            {/* Navigation Arrows */}
            {currentIndex > 0 && (
              <button
                onClick={() => onNavigate(currentIndex - 1)}
                className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-slate-900/80 hover:bg-slate-900 backdrop-blur-md border border-slate-700 text-white shadow-xl"
                title="Previous Page"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
            )}

            {currentIndex < totalPages - 1 && (
              <button
                onClick={() => onNavigate(currentIndex + 1)}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-slate-900/80 hover:bg-slate-900 backdrop-blur-md border border-slate-700 text-white shadow-xl"
                title="Next Page"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            )}
          </div>

          {/* Side Panel: OCR Text & Annotations */}
          <div className="w-full md:w-80 lg:w-96 bg-slate-900 border-t md:border-t-0 md:border-l border-slate-800 p-4 overflow-y-auto space-y-4 flex flex-col justify-between">
            <div className="space-y-4">
              {/* OCR Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-blue-400" />
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                    Extracted Text (OCR)
                  </h4>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleRunOcr}
                    disabled={isOcrRunning}
                    className="text-xs text-purple-400 hover:text-purple-300 flex items-center gap-1 px-2 py-0.5 rounded-lg bg-purple-500/10 border border-purple-500/20 disabled:opacity-50"
                    title="Run OCR to extract text from this page"
                  >
                    {isOcrRunning ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Reading...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>{ocrText ? 'Re-OCR' : 'Extract OCR'}</span>
                      </>
                    )}
                  </button>

                  {ocrText && (
                    <button
                      onClick={handleCopyOcr}
                      className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1"
                    >
                      {copiedOcr ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="text-emerald-400">Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>

              {/* OCR Text Box */}
              <div>
                <textarea
                  rows={8}
                  value={ocrText}
                  onChange={(e) => setOcrText(e.target.value)}
                  placeholder="Scanned text recognized from notes will appear here, or you can type key points manually to make this page searchable..."
                  className="w-full p-3 bg-slate-950/70 border border-slate-800 rounded-xl text-xs text-slate-200 leading-relaxed focus:outline-none focus:border-blue-500 font-sans"
                />
              </div>

              {/* Bookmark Note */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Sudha's Revision Note
                </label>
                <input
                  type="text"
                  value={bookmarkNote}
                  onChange={(e) => setBookmarkNote(e.target.value)}
                  placeholder="e.g. Must revise before BPSC Prelims"
                  className="w-full px-3 py-2 bg-slate-950/70 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800 flex justify-between items-center">
              <span className="text-[11px] text-slate-500">
                Filter: {page.filter || 'magic_color'}
              </span>

              <button
                onClick={handleSaveOcrText}
                className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs rounded-xl shadow transition-colors"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
