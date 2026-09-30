import React, { useState } from 'react';
import {
  X,
  Sparkles,
  BookOpen,
  Zap,
  Target,
  Globe,
  Loader2,
  CheckCircle2,
  Cpu,
  Layers,
} from 'lucide-react';

export default function CreateAiNotesModal({
  isOpen,
  onClose,
  chapter,
  subject,
  pages,
  onGenerate,
}) {
  if (!isOpen || !chapter) return null;

  const [examFocus, setExamFocus] = useState('integrated'); // 'prelims' | 'mains' | 'integrated'
  const [style, setStyle] = useState('detailed');           // 'detailed' | 'revision' | 'oneshot'
  const [language, setLanguage] = useState('hindi');         // 'hindi' | 'bilingual' | 'english'
  const [isGenerating, setIsGenerating] = useState(false);
  const [progressStep, setProgressStep] = useState(0);

  const steps = [
    'हस्तलिखित पृष्ठों का मल्टीमॉडल विश्लेषण...',
    'नोट्स से मुख्य तथ्य, तिथियां व अवधारणाएं संकलित की जा रही हैं...',
    'BPSC पाठ्यक्रम एवं बिहार संदर्भ जोड़ा जा रहा है...',
    'नेपकिन-शैली आरेख, फ्लोचार्ट एवं कालक्रम तैयार हो रहा है...',
    'आपकी BPSC अध्ययन पुस्तक तैयार है!',
  ];

  const handleStartGeneration = async () => {
    setIsGenerating(true);
    setProgressStep(0);

    // Simulated step intervals for responsive UX while Gemini executes
    const interval = setInterval(() => {
      setProgressStep((prev) => {
        if (prev < steps.length - 2) return prev + 1;
        return prev;
      });
    }, 1800);

    try {
      await onGenerate({
        examFocus,
        style,
        language,
      });

      setProgressStep(steps.length - 1);
      setTimeout(() => {
        clearInterval(interval);
        setIsGenerating(false);
        onClose();
      }, 1000);
    } catch (err) {
      clearInterval(interval);
      setIsGenerating(false);
      console.error('Generation failed:', err);
      alert('नोट्स तैयार करने में समस्या आई। पुनः प्रयास करें।');
    }
  };

  return (
    <div
      onClick={isGenerating ? undefined : onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200 cursor-pointer"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl text-white cursor-default space-y-6 relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-48 h-48 bg-purple-500/10 rounded-full blur-3xl pointer-events-none"></div>

        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 relative z-10">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-white">
                BPSC AI अध्ययन पुस्तक तैयार करें
              </h3>
              <p className="text-xs text-slate-400">
                {pages.length} मूल पृष्ठ • {chapter.hindiTitle || chapter.title}
              </p>
            </div>
          </div>

          {!isGenerating && (
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* In-progress state */}
        {isGenerating ? (
          <div className="py-10 flex flex-col items-center justify-center text-center space-y-5">
            <div className="relative">
              <div className="w-16 h-16 rounded-2xl bg-purple-600/20 text-purple-400 border border-purple-500/30 flex items-center justify-center">
                <Cpu className="w-8 h-8 animate-pulse text-purple-400" />
              </div>
              <div className="absolute -inset-1 rounded-2xl border-2 border-purple-500/30 animate-ping opacity-30"></div>
            </div>

            <div className="space-y-2 max-w-sm">
              <h4 className="text-base font-bold text-white">
                Gemini Reader BPSC नोट्स तैयार कर रहा है
              </h4>
              <p className="text-xs text-purple-300 font-medium animate-pulse">
                {steps[progressStep]}
              </p>
            </div>

            <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
              <div
                className="bg-gradient-to-r from-purple-500 to-blue-500 h-2 transition-all duration-500"
                style={{
                  width: `${((progressStep + 1) / steps.length) * 100}%`,
                }}
              ></div>
            </div>
          </div>
        ) : (
          /* Configuration Options */
          <div className="space-y-5 relative z-10">
            {/* 1. Exam Focus */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Target className="w-3.5 h-3.5 text-blue-400" />
                <span>1. BPSC परीक्षा फोकस (Exam Focus)</span>
              </label>

              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'prelims', label: 'प्रारंभिक (PT)', sub: 'तथ्य, तिथियां, MCQs' },
                  { id: 'mains', label: 'मुख्य (Mains)', sub: 'उत्तर प्रारूप, विश्लेषण' },
                  { id: 'integrated', label: 'समग्र (Both)', sub: 'PT + Mains संपूर्ण' },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setExamFocus(item.id)}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      examFocus === item.id
                        ? 'border-purple-500 bg-purple-500/15 text-white ring-1 ring-purple-500'
                        : 'border-slate-800 bg-slate-950/50 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <div className="text-xs font-bold flex items-center justify-between">
                      <span>{item.label}</span>
                      {examFocus === item.id && (
                        <CheckCircle2 className="w-3.5 h-3.5 text-purple-400" />
                      )}
                    </div>
                    <div className="text-[10px] text-slate-400 mt-1">{item.sub}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* 2. Note Style */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-emerald-400" />
                <span>2. अध्ययन शैली (Study Note Style)</span>
              </label>

              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'detailed', label: 'विस्तृत पुस्तक', sub: 'सम्पूर्ण BPSC गाइड' },
                  { id: 'revision', label: 'त्वरित रिविजन', sub: 'सारगर्भित शीट' },
                  { id: 'oneshot', label: 'वन-शॉट कैप्सूल', sub: 'अंतिम समय तैयारी' },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setStyle(item.id)}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      style === item.id
                        ? 'border-emerald-500 bg-emerald-500/15 text-white ring-1 ring-emerald-500'
                        : 'border-slate-800 bg-slate-950/50 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <div className="text-xs font-bold flex items-center justify-between">
                      <span>{item.label}</span>
                      {style === item.id && (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      )}
                    </div>
                    <div className="text-[10px] text-slate-400 mt-1">{item.sub}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* 3. Language */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-amber-400" />
                <span>3. भाषा (Language Preference)</span>
              </label>

              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'hindi', label: '100% हिन्दी', sub: 'मानक देवनागरी' },
                  { id: 'bilingual', label: 'द्विभाषी (Hinglish)', sub: 'हिन्दी + English' },
                  { id: 'english', label: 'English', sub: 'Formal BPSC style' },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setLanguage(item.id)}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      language === item.id
                        ? 'border-amber-500 bg-amber-500/15 text-white ring-1 ring-amber-500'
                        : 'border-slate-800 bg-slate-950/50 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <div className="text-xs font-bold flex items-center justify-between">
                      <span>{item.label}</span>
                      {language === item.id && (
                        <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" />
                      )}
                    </div>
                    <div className="text-[10px] text-slate-400 mt-1">{item.sub}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Note Info Callout */}
            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-[11px] text-slate-400 leading-relaxed">
              💡 <span className="font-semibold text-slate-300">सुधा के लिए विशेष:</span> आपके मूल हस्तलिखित स्कैन सुरक्षित रहेंगे। AI आपके पृष्ठों को पढ़कर एक सुंदर, व्यवस्थित एवं BPSC परीक्षा-केंद्रित डिजिटल अध्ययन सामग्री तैयार करेगा।
            </div>

            {/* Action Buttons */}
            <div className="pt-2 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
              >
                रद्द करें
              </button>

              <button
                type="button"
                onClick={handleStartGeneration}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-bold text-xs sm:text-sm shadow-lg shadow-purple-600/30 flex items-center gap-2 transition-all active:scale-95"
              >
                <Sparkles className="w-4 h-4" />
                <span>अभी BPSC नोट्स जनरेट करें</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
