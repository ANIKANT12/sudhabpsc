import React, { useState } from 'react';
import {
  X,
  Download,
  FileText,
  Sliders,
  CheckSquare,
  Square,
  Sparkles,
  Loader2,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { downloadChapterPDF } from '../utils/pdfGenerator';

export default function PdfExportModal({
  isOpen,
  onClose,
  chapter,
  subject,
  pages,
}) {
  if (!isOpen || !chapter) return null;

  const [addHeader, setAddHeader] = useState(true);
  const [addPageNumbers, setAddPageNumbers] = useState(true);
  const [addWatermark, setAddWatermark] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');

  const handleDownload = async () => {
    setIsGenerating(true);
    setStatusMessage('स्कैन किए गए नोट्स संकलित किए जा रहे हैं...');

    try {
      await downloadChapterPDF(chapter, subject, pages, {
        addHeader,
        addPageNumbers,
        addWatermark,
        quality: 0.92,
      });

      setStatusMessage('PDF तैयार है! डाउनलोड हो रहा है...');
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.7 },
      });

      setTimeout(() => {
        setIsGenerating(false);
        onClose();
      }, 1200);
    } catch (err) {
      console.error('PDF error:', err);
      alert('PDF बनाने में त्रुटि हुई। कृपया पुनः प्रयास करें।');
      setIsGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl text-white">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <Download className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                अध्याय PDF डाउनलोड करें
              </h3>
              <p className="text-xs text-slate-400">
                {pages.length} पृष्ठ • {chapter.hindiTitle || chapter.title}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Options */}
        <div className="space-y-3 py-2">
          <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">
            PDF फॉर्मेटिंग विकल्प
          </label>

          {/* Add Page Numbers */}
          <div
            onClick={() => setAddPageNumbers(!addPageNumbers)}
            className="p-3 bg-slate-800/80 hover:bg-slate-800 rounded-xl border border-slate-700/80 flex items-center justify-between cursor-pointer select-none"
          >
            <div>
              <div className="text-xs font-semibold text-white">
                पृष्ठ संख्या (Page Numbers) जोड़ें
              </div>
              <div className="text-[11px] text-slate-400">
                प्रत्येक पृष्ठ के नीचे "पृष्ठ X / Y" प्रदर्शित करेगा
              </div>
            </div>
            {addPageNumbers ? (
              <CheckSquare className="w-5 h-5 text-blue-500" />
            ) : (
              <Square className="w-5 h-5 text-slate-500" />
            )}
          </div>

          {/* Add Header */}
          <div
            onClick={() => setAddHeader(!addHeader)}
            className="p-3 bg-slate-800/80 hover:bg-slate-800 rounded-xl border border-slate-700/80 flex items-center justify-between cursor-pointer select-none"
          >
            <div>
              <div className="text-xs font-semibold text-white">
                विषय एवं अध्याय हेडर
              </div>
              <div className="text-[11px] text-slate-400">
                पृष्ठ के ऊपर सुंदर विषय एवं अध्याय का शीर्षक जोड़ेगा
              </div>
            </div>
            {addHeader ? (
              <CheckSquare className="w-5 h-5 text-blue-500" />
            ) : (
              <Square className="w-5 h-5 text-slate-500" />
            )}
          </div>

          {/* Add Watermark */}
          <div
            onClick={() => setAddWatermark(!addWatermark)}
            className="p-3 bg-slate-800/80 hover:bg-slate-800 rounded-xl border border-slate-700/80 flex items-center justify-between cursor-pointer select-none"
          >
            <div>
              <div className="text-xs font-semibold text-white">
                सुधा BPSC वाटरमार्क
              </div>
              <div className="text-[11px] text-slate-400">
                पृष्ठभूमि में हल्का व्यक्तिगत वाटरमार्क
              </div>
            </div>
            {addWatermark ? (
              <CheckSquare className="w-5 h-5 text-blue-500" />
            ) : (
              <Square className="w-5 h-5 text-slate-500" />
            )}
          </div>
        </div>

        {/* Status indicator */}
        {statusMessage && (
          <div className="mt-3 p-2 bg-blue-500/10 border border-blue-500/20 rounded-xl text-center text-xs text-blue-300 flex items-center justify-center gap-2">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            <span>{statusMessage}</span>
          </div>
        )}

        {/* Download Action */}
        <div className="mt-6 pt-3 border-t border-slate-800 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs text-slate-400 hover:text-white"
          >
            रद्द करें
          </button>

          <button
            type="button"
            disabled={isGenerating}
            onClick={handleDownload}
            className="px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 text-white font-bold text-xs sm:text-sm rounded-xl shadow-lg shadow-emerald-600/30 flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            <span>PDF बनाएं व डाउनलोड करें</span>
          </button>
        </div>
      </div>
    </div>
  );
}
