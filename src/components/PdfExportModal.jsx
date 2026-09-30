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
  BookOpen,
  Zap,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import {
  downloadChapterPDF,
  downloadAiBookPDF,
  downloadQuickRevisionPDF,
} from '../utils/pdfGenerator';
import { generateBpscStudyNotes } from '../services/aiNoteEngine';

export default function PdfExportModal({
  isOpen,
  onClose,
  chapter,
  subject,
  pages,
  aiNotes,
  onSaveAiNotes,
}) {
  if (!isOpen || !chapter) return null;

  const [exportType, setExportType] = useState(aiNotes ? 'ai_book' : 'scanned'); // 'scanned' | 'ai_book' | 'quick_revision'
  const [addHeader, setAddHeader] = useState(true);
  const [addPageNumbers, setAddPageNumbers] = useState(true);
  const [addWatermark, setAddWatermark] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');

  const handleDownload = async () => {
    setIsGenerating(true);

    try {
      if (exportType === 'scanned') {
        setStatusMessage('स्कैन किए गए नोट्स संकलित किए जा रहे हैं...');
        await downloadChapterPDF(chapter, subject, pages, {
          addHeader,
          addPageNumbers,
          addWatermark,
          quality: 0.92,
        });
      } else {
        let activeNotes = aiNotes || chapter.aiStudyNotes;
        if (!activeNotes) {
          setStatusMessage('AI BPSC नोट्स तैयार किए जा रहे हैं...');
          activeNotes = await generateBpscStudyNotes({
            chapter,
            subject,
            pages,
            config: { examFocus: 'integrated', style: 'detailed', language: 'hindi' },
          });
          if (onSaveAiNotes && activeNotes) {
            onSaveAiNotes(chapter.id, activeNotes);
          }
        }

        if (exportType === 'ai_book') {
          setStatusMessage('AI BPSC सम्पूर्ण अध्ययन गाइड PDF तैयार हो रही है...');
          await downloadAiBookPDF(chapter, subject, activeNotes);
        } else if (exportType === 'quick_revision') {
          setStatusMessage('त्वरित रिविजन शीट PDF तैयार हो रही है...');
          await downloadQuickRevisionPDF(chapter, subject, activeNotes);
        }
      }

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

  // ESC key to close
  React.useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div
      onClick={isGenerating ? undefined : onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200 cursor-pointer"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl text-white cursor-default space-y-5"
      >
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-white">
                BPSC 3-Tier PDF डाउनलोड
              </h3>
              <p className="text-xs text-slate-400">
                {pages.length} मूल पृष्ठ • {chapter.hindiTitle || chapter.title}
              </p>
            </div>
          </div>

          {!isGenerating && (
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 cursor-pointer transition-colors"
              title="बंद करें (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* 3-Tier Mode Selector */}
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
            डाउनलोड हेतु PDF का प्रकार चुनें:
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <button
              type="button"
              onClick={() => setExportType('ai_book')}
              className={`p-3 rounded-2xl border text-left transition-all ${
                exportType === 'ai_book'
                  ? 'border-purple-500 bg-purple-500/15 text-white ring-1 ring-purple-500'
                  : 'border-slate-800 bg-slate-950/40 text-slate-300 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center gap-1.5 text-purple-400 text-xs font-bold mb-1">
                <BookOpen className="w-4 h-4" />
                <span>📘 AI BPSC बुक</span>
              </div>
              <p className="text-[10px] text-slate-400 leading-tight">
                फ्लोचार्ट, टाइमलाइन, सारणी एवं संपूर्ण विश्लेषण
              </p>
            </button>

            <button
              type="button"
              onClick={() => setExportType('quick_revision')}
              className={`p-3 rounded-2xl border text-left transition-all ${
                exportType === 'quick_revision'
                  ? 'border-amber-500 bg-amber-500/15 text-white ring-1 ring-amber-500'
                  : 'border-slate-800 bg-slate-950/40 text-slate-300 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center gap-1.5 text-amber-400 text-xs font-bold mb-1">
                <Zap className="w-4 h-4" />
                <span>⚡ रिविजन शीट</span>
              </div>
              <p className="text-[10px] text-slate-400 leading-tight">
                1-2 पृष्ठों का उच्च-प्राप्ति (High-Yield) परीक्षा सारांश
              </p>
            </button>

            <button
              type="button"
              onClick={() => setExportType('scanned')}
              className={`p-3 rounded-2xl border text-left transition-all ${
                exportType === 'scanned'
                  ? 'border-emerald-500 bg-emerald-500/15 text-white ring-1 ring-emerald-500'
                  : 'border-slate-800 bg-slate-950/40 text-slate-300 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center gap-1.5 text-emerald-400 text-xs font-bold mb-1">
                <FileText className="w-4 h-4" />
                <span>📕 मूल स्कैन PDF</span>
              </div>
              <p className="text-[10px] text-slate-400 leading-tight">
                सुधा के हस्तलिखित स्कैन किए गए पृष्ठ यथावत
              </p>
            </button>
          </div>
        </div>

        {/* Options for Scanned PDF */}
        {exportType === 'scanned' && (
          <div className="space-y-2 py-1">
            <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
              स्कैन PDF विकल्प:
            </label>

            <div
              onClick={() => setAddPageNumbers(!addPageNumbers)}
              className="p-2.5 bg-slate-800/80 hover:bg-slate-800 rounded-xl border border-slate-700/80 flex items-center justify-between cursor-pointer select-none"
            >
              <div className="text-xs text-white">पृष्ठ संख्या (Page Numbers) जोड़ें</div>
              {addPageNumbers ? (
                <CheckSquare className="w-4 h-4 text-blue-500" />
              ) : (
                <Square className="w-4 h-4 text-slate-500" />
              )}
            </div>

            <div
              onClick={() => setAddHeader(!addHeader)}
              className="p-2.5 bg-slate-800/80 hover:bg-slate-800 rounded-xl border border-slate-700/80 flex items-center justify-between cursor-pointer select-none"
            >
              <div className="text-xs text-white">विषय एवं अध्याय हेडर जोड़ें</div>
              {addHeader ? (
                <CheckSquare className="w-4 h-4 text-blue-500" />
              ) : (
                <Square className="w-4 h-4 text-slate-500" />
              )}
            </div>
          </div>
        )}

        {/* Status indicator */}
        {statusMessage && (
          <div className="p-2.5 bg-purple-500/10 border border-purple-500/20 rounded-xl text-center text-xs text-purple-300 flex items-center justify-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin text-purple-400" />
            <span>{statusMessage}</span>
          </div>
        )}

        {/* Download Action */}
        <div className="pt-2 border-t border-slate-800 flex justify-end gap-2">
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
            className="px-6 py-2.5 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 disabled:opacity-50 text-white font-bold text-xs sm:text-sm rounded-xl shadow-lg shadow-purple-600/30 flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            <span>PDF डाउनलोड करें</span>
          </button>
        </div>
      </div>
    </div>
  );
}
