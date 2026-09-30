import React, { useState, useEffect } from 'react';
import {
  X,
  Sparkles,
  BookOpen,
  HelpCircle,
  Brain,
  ListOrdered,
  RotateCw,
  CheckCircle2,
  XCircle,
  Loader2,
  Copy,
  Check,
} from 'lucide-react';
import { generateStudyContent } from '../services/aiAssistant';

export default function AiAssistantModal({
  isOpen,
  onClose,
  chapter,
  subject,
  pages,
  apiKey,
}) {
  if (!isOpen || !chapter) return null;

  const [activeTab, setActiveTab] = useState('summary'); // 'summary' | 'mcq' | 'flashcards' | 'facts'
  const [loading, setLoading] = useState(false);
  const [content, setContent] = useState({});
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [activeFlashcard, setActiveFlashcard] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [copied, setCopied] = useState(false);

  // Compile OCR text from pages
  const pagesText = pages
    .filter((p) => p.ocrText)
    .map((p) => p.ocrText)
    .join('\n\n');

  const fetchTabContent = async (tab) => {
    if (content[tab]) return; // already loaded
    setLoading(true);
    try {
      const res = await generateStudyContent(
        tab,
        chapter,
        subject,
        pagesText,
        apiKey
      );
      setContent((prev) => ({ ...prev, [tab]: res }));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // Reset cache whenever chapter changes so each chapter gets its own notes
  useEffect(() => {
    setContent({});
    setSelectedAnswers({});
    setActiveFlashcard(0);
    setIsFlipped(false);
  }, [chapter?.id]);

  useEffect(() => {
    if (isOpen && chapter?.id) {
      fetchTabContent(activeTab);
    }
  }, [isOpen, activeTab, chapter?.id]);

  const handleCopySummary = () => {
    if (!content.summary) return;
    navigator.clipboard.writeText(content.summary);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-md overflow-hidden text-white animate-in fade-in duration-200">
      <div className="w-full max-w-3xl h-[88vh] bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden">
        {/* Top Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30 flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                BPSC Smart AI Revision
              </h3>
              <p className="text-xs text-slate-400">
                {subject?.title} • {chapter?.title}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="flex items-center gap-2 px-6 py-3 border-b border-slate-800 bg-slate-950/40 overflow-x-auto">
          {[
            { id: 'summary', name: 'Summary', icon: BookOpen },
            { id: 'mcq', name: 'BPSC MCQs Practice', icon: HelpCircle },
            { id: 'flashcards', name: 'Flashcards', icon: Brain },
            { id: 'facts', name: 'Important Facts', icon: ListOrdered },
          ].map((t) => {
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  activeTab === t.id
                    ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
                    : 'bg-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{t.name}</span>
              </button>
            );
          })}
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="h-full flex flex-col items-center justify-center space-y-3 text-slate-400">
              <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
              <p className="text-xs">
                Analyzing handwritten notes & generating BPSC study material...
              </p>
            </div>
          ) : (
            <>
              {/* TAB 1: SUMMARY */}
              {activeTab === 'summary' && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-slate-400 font-medium">
                      High-yield revision notes synthesized from your scans
                    </span>
                    <button
                      onClick={handleCopySummary}
                      className="text-xs text-purple-300 hover:text-white flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700"
                    >
                      {copied ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy Summary</span>
                        </>
                      )}
                    </button>
                  </div>

                  <div className="p-5 bg-slate-950/60 border border-slate-800 rounded-2xl text-slate-200 text-xs sm:text-sm leading-relaxed whitespace-pre-wrap font-sans">
                    {content.summary}
                  </div>
                </div>
              )}

              {/* TAB 2: MCQS */}
              {activeTab === 'mcq' && (
                <div className="space-y-6">
                  {Array.isArray(content.mcq) ? (
                    content.mcq.map((item, qIdx) => {
                      const userChoice = selectedAnswers[qIdx];
                      const isAnswered = userChoice !== undefined;

                      return (
                        <div
                          key={qIdx}
                          className="p-5 bg-slate-950/60 border border-slate-800 rounded-2xl space-y-3"
                        >
                          <div className="flex items-start gap-2">
                            <span className="w-6 h-6 rounded-lg bg-purple-600/20 text-purple-400 border border-purple-500/30 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                              {qIdx + 1}
                            </span>
                            <h4 className="text-xs sm:text-sm font-semibold text-white">
                              {item.question}
                            </h4>
                          </div>

                          <div className="space-y-2 pt-1 pl-8">
                            {item.options.map((opt, oIdx) => {
                              const isCorrect = oIdx === item.answer;
                              const isSelected = userChoice === oIdx;

                              let optClass =
                                'bg-slate-900 border-slate-700/80 text-slate-300 hover:bg-slate-800';

                              if (isAnswered) {
                                if (isCorrect) {
                                  optClass =
                                    'bg-emerald-500/20 border-emerald-500 text-emerald-200';
                                } else if (isSelected) {
                                  optClass =
                                    'bg-red-500/20 border-red-500 text-red-200';
                                } else {
                                  optClass =
                                    'bg-slate-900/50 border-slate-800 text-slate-500';
                                }
                              }

                              return (
                                <button
                                  key={oIdx}
                                  type="button"
                                  onClick={() => {
                                    if (!isAnswered) {
                                      setSelectedAnswers((prev) => ({
                                        ...prev,
                                        [qIdx]: oIdx,
                                      }));
                                    }
                                  }}
                                  className={`w-full text-left p-3 rounded-xl border text-xs sm:text-sm font-medium transition-all flex items-center justify-between ${optClass}`}
                                >
                                  <span>{opt}</span>
                                  {isAnswered && isCorrect && (
                                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 ml-2" />
                                  )}
                                  {isAnswered && isSelected && !isCorrect && (
                                    <XCircle className="w-4 h-4 text-red-400 shrink-0 ml-2" />
                                  )}
                                </button>
                              );
                            })}
                          </div>

                          {isAnswered && item.explanation && (
                            <div className="mt-3 ml-8 p-3 rounded-xl bg-purple-500/10 border border-purple-500/20 text-xs text-purple-200">
                              <span className="font-bold">Explanation: </span>
                              {item.explanation}
                            </div>
                          )}
                        </div>
                      );
                    })
                  ) : (
                    <div className="p-5 bg-slate-950/60 rounded-2xl whitespace-pre-wrap text-xs">
                      {content.mcq}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: FLASHCARDS */}
              {activeTab === 'flashcards' && (
                <div className="flex flex-col items-center justify-center space-y-6 py-6">
                  {Array.isArray(content.flashcards) &&
                  content.flashcards.length > 0 ? (
                    <div className="w-full max-w-md space-y-4">
                      <div
                        onClick={() => setIsFlipped(!isFlipped)}
                        className="relative min-h-[220px] bg-gradient-to-br from-slate-800 to-slate-900 border-2 border-purple-500/40 rounded-3xl p-8 flex flex-col items-center justify-center text-center cursor-pointer shadow-2xl transition-all hover:scale-[1.01] select-none"
                      >
                        <div className="text-[10px] font-bold uppercase tracking-wider text-purple-400 mb-2">
                          {isFlipped
                            ? '💡 Answer / Explanation'
                            : '❓ Question (Tap to Reveal)'}
                        </div>

                        <p className="text-base sm:text-lg font-bold text-white">
                          {isFlipped
                            ? content.flashcards[activeFlashcard]?.back
                            : content.flashcards[activeFlashcard]?.front}
                        </p>

                        <span className="absolute bottom-3 text-[10px] text-slate-500">
                          Card {activeFlashcard + 1} of{' '}
                          {content.flashcards.length}
                        </span>
                      </div>

                      {/* Controls */}
                      <div className="flex items-center justify-between">
                        <button
                          onClick={() => {
                            setIsFlipped(false);
                            setActiveFlashcard((prev) => Math.max(0, prev - 1));
                          }}
                          disabled={activeFlashcard === 0}
                          className="px-4 py-2 bg-slate-800 text-xs font-semibold rounded-xl disabled:opacity-30"
                        >
                          Previous Card
                        </button>

                        <button
                          onClick={() => setIsFlipped(!isFlipped)}
                          className="text-xs text-purple-400 font-semibold"
                        >
                          Flip Card
                        </button>

                        <button
                          onClick={() => {
                            setIsFlipped(false);
                            setActiveFlashcard((prev) =>
                              Math.min(content.flashcards.length - 1, prev + 1)
                            );
                          }}
                          disabled={
                            activeFlashcard === content.flashcards.length - 1
                          }
                          className="px-4 py-2 bg-slate-800 text-xs font-semibold rounded-xl disabled:opacity-30"
                        >
                          Next Card
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-xs text-slate-400">
                      No flashcards generated yet.
                    </div>
                  )}
                </div>
              )}

              {/* TAB 4: FACTS */}
              {activeTab === 'facts' && (
                <div className="p-5 bg-slate-950/60 border border-slate-800 rounded-2xl text-slate-200 text-xs sm:text-sm leading-relaxed whitespace-pre-wrap font-sans">
                  {content.facts}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
