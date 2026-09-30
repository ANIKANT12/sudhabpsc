import React, { useState } from 'react';
import {
  Sparkles,
  RefreshCw,
  Download,
  Copy,
  Check,
  BookOpen,
  Calendar,
  Layers,
  Award,
  FileText,
  Clock,
  Printer,
  ChevronDown,
} from 'lucide-react';
import {
  FlowchartVisual,
  VerticalTimeline,
  ComparisonTable,
  SectionAttributionCard,
  BiharSpecialGrid,
  MainsAnswerFrameworkCard,
} from './AiVisualRenderer';

export default function ChapterAiStudyNotes({
  notes,
  chapter,
  subject,
  pages,
  onRegenerate,
  onExportPdf,
}) {
  const [activeFilter, setActiveFilter] = useState('all'); // 'all' | 'sections' | 'diagrams' | 'timeline' | 'bihar' | 'mains'
  const [isCopied, setIsCopied] = useState(false);

  if (!notes) return null;

  const handleCopyMarkdown = () => {
    let text = `# ${chapter.hindiTitle || chapter.title}\n\n`;
    text += `## सारांश\n${notes.executiveSummary}\n\n`;
    text += `## परीक्षा दृष्टिकोण\n${notes.examOrientation}\n\n`;

    if (notes.sections) {
      notes.sections.forEach((sec, idx) => {
        text += `### ${sec.title}\n`;
        text += `**आपकी कॉपी से:**\n${(sec.sourceNotes || []).join('\n')}\n\n`;
        text += `**BPSC मूल्य संवर्धन:**\n${(sec.bpscEnrichment || []).join('\n')}\n\n`;
        if (sec.bpscHighYield) text += `> ${sec.bpscHighYield}\n\n`;
      });
    }

    if (notes.timeline) {
      text += `## महत्वपूर्ण कालक्रम\n`;
      notes.timeline.forEach((t) => {
        text += `- **${t.dateOrYear}**: ${t.title} - ${t.description}\n`;
      });
      text += '\n';
    }

    if (notes.biharSpecial) {
      text += `## बिहार विशेष संदर्भ\n`;
      notes.biharSpecial.forEach((b) => {
        text += `- **${b.name}** (${b.place}): ${b.role}\n`;
      });
    }

    navigator.clipboard?.writeText(text);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const metrics = notes.dashboardMetrics || {
    topicsCount: notes.sections?.length || 0,
    timelineEventsCount: notes.timeline?.length || 0,
    keyFactsCount: notes.highYieldFacts?.length || 0,
    biharSpecialCount: notes.biharSpecial?.length || 0,
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Banner & Control Strip */}
      <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-r from-purple-950 via-slate-900 to-slate-900 border border-purple-500/40 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 text-xs font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30 rounded-full flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                <span>BPSC AI अध्ययन पुस्तक</span>
              </span>
              <span className="px-2 py-0.5 text-[11px] font-semibold bg-slate-800 text-slate-300 border border-slate-700 rounded-md">
                {notes.metadata?.examFocus === 'prelims'
                  ? '🎯 प्रारंभिक परीक्षा फोकस'
                  : notes.metadata?.examFocus === 'mains'
                  ? '🖋️ मुख्य परीक्षा फोकस'
                  : '⭐ PT + Mains समग्र'}
              </span>
              <span className="px-2 py-0.5 text-[11px] font-semibold bg-slate-800 text-slate-300 border border-slate-700 rounded-md">
                {notes.metadata?.language === 'english' ? '🇬🇧 English' : '🇮🇳 हिन्दी (देवनागरी)'}
              </span>
            </div>

            <h3 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
              {chapter.hindiTitle || chapter.title}
            </h3>

            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              {notes.executiveSummary}
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 flex-wrap self-start md:self-center">
            <button
              onClick={onRegenerate}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold rounded-xl transition-all flex items-center gap-1.5"
              title="पुनः नए सिरे से BPSC नोट्स तैयार करें"
            >
              <RefreshCw className="w-3.5 h-3.5 text-purple-400" />
              <span>पुनः जनरेट करें</span>
            </button>

            <button
              onClick={handleCopyMarkdown}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold rounded-xl transition-all flex items-center gap-1.5"
              title="पूरे नोट्स कॉपी करें"
            >
              {isCopied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400 font-bold">कॉपी हो गया!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-blue-400" />
                  <span>कॉपी करें</span>
                </>
              )}
            </button>

            <button
              onClick={() => onExportPdf('aiBook')}
              className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-bold text-xs sm:text-sm rounded-xl shadow-lg shadow-purple-600/30 transition-all flex items-center gap-2 active:scale-95"
              title="सुधा BPSC अध्ययन गाइड PDF डाउनलोड करें"
            >
              <Download className="w-4 h-4" />
              <span>AI पुस्तक PDF</span>
            </button>
          </div>
        </div>

        {/* Dashboard Metrics Strip */}
        <div className="mt-5 pt-4 border-t border-purple-500/20 grid grid-cols-2 sm:grid-cols-4 gap-3 relative z-10">
          <div className="p-2.5 rounded-xl bg-slate-950/40 border border-purple-500/20 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-sm">
              📷
            </div>
            <div>
              <div className="text-lg font-black text-white">{pages.length}</div>
              <div className="text-[10px] text-slate-400 uppercase font-semibold">मूल पृष्ठ पठित</div>
            </div>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-950/40 border border-purple-500/20 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-sm">
              📑
            </div>
            <div>
              <div className="text-lg font-black text-white">{metrics.topicsCount}</div>
              <div className="text-[10px] text-slate-400 uppercase font-semibold">BPSC टॉपिक</div>
            </div>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-950/40 border border-purple-500/20 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-sm">
              🗓️
            </div>
            <div>
              <div className="text-lg font-black text-white">{metrics.timelineEventsCount}</div>
              <div className="text-[10px] text-slate-400 uppercase font-semibold">कालक्रम तिथियां</div>
            </div>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-950/40 border border-purple-500/20 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-rose-500/20 text-rose-400 flex items-center justify-center font-bold text-sm">
              🟡
            </div>
            <div>
              <div className="text-lg font-black text-white">{metrics.biharSpecialCount}</div>
              <div className="text-[10px] text-slate-400 uppercase font-semibold">बिहार विशेष बिंदु</div>
            </div>
          </div>
        </div>
      </div>

      {/* Filter / Quick Jump Navigation Strip */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-800">
        {[
          { id: 'all', label: '📖 सम्पूर्ण पुस्तक', count: null },
          { id: 'diagrams', label: '📊 आरेख एवं फ्लोचार्ट', count: notes.diagrams?.length },
          { id: 'timeline', label: '🗓️ BPSC टाइमलाइन', count: notes.timeline?.length },
          { id: 'tables', label: '📋 तुलनात्मक सारणी', count: notes.comparisonTables?.length },
          { id: 'bihar', label: '🟡 बिहार विशेष', count: notes.biharSpecial?.length },
          { id: 'mains', label: '🖋️ मुख्य परीक्षा प्रारूप', count: null },
          { id: 'facts', label: '⭐ मुख्य तथ्य', count: notes.highYieldFacts?.length },
        ].map((f) => (
          <button
            key={f.id}
            onClick={() => setActiveFilter(f.id)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
              activeFilter === f.id
                ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                : 'bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800'
            }`}
          >
            <span>{f.label}</span>
            {f.count !== null && f.count !== undefined && (
              <span className="w-4 h-4 rounded-full bg-slate-800 text-slate-300 text-[10px] flex items-center justify-center">
                {f.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Main Content Area based on Filter */}
      <div className="space-y-6">
        {/* 1. Exam Orientation Alert */}
        {(activeFilter === 'all' || activeFilter === 'mains') && notes.examOrientation && (
          <div className="p-4 rounded-2xl bg-blue-950/20 border border-blue-500/30 flex items-start gap-3">
            <span className="text-xl shrink-0 mt-0.5">🎯</span>
            <div className="space-y-1">
              <h5 className="text-xs font-bold uppercase tracking-wider text-blue-400">
                BPSC 70th/71st परीक्षा रणनीति एवं दृष्टिकोण:
              </h5>
              <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
                {notes.examOrientation}
              </p>
            </div>
          </div>
        )}

        {/* 2. Visual Flowcharts (Napkin-AI Style) */}
        {(activeFilter === 'all' || activeFilter === 'diagrams') &&
          notes.diagrams &&
          notes.diagrams.map((d, idx) => <FlowchartVisual key={d.id || idx} diagram={d} />)}

        {/* 3. Vertical BPSC Timeline */}
        {(activeFilter === 'all' || activeFilter === 'timeline') && notes.timeline && (
          <VerticalTimeline timeline={notes.timeline} />
        )}

        {/* 4. Comparison Tables */}
        {(activeFilter === 'all' || activeFilter === 'tables') &&
          notes.comparisonTables &&
          notes.comparisonTables.map((t, idx) => <ComparisonTable key={idx} table={t} />)}

        {/* 5. Sections with Dual Attribution (From your notes vs BPSC Value add) */}
        {(activeFilter === 'all' || activeFilter === 'sections') && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <span>📚 अध्याय के मुख्य बिंदु एवं विस्तृत विश्लेषण</span>
              </h4>
              <span className="text-xs text-slate-400 font-medium">
                (हस्तलिखित नोट्स + BPSC मानक संदर्भ)
              </span>
            </div>

            {notes.sections &&
              notes.sections.map((sec, idx) => (
                <SectionAttributionCard key={sec.id || idx} section={sec} index={idx} />
              ))}
          </div>
        )}

        {/* 6. Bihar Special */}
        {(activeFilter === 'all' || activeFilter === 'bihar') && notes.biharSpecial && (
          <BiharSpecialGrid biharSpecial={notes.biharSpecial} />
        )}

        {/* 7. Mains Answer Writing Framework */}
        {(activeFilter === 'all' || activeFilter === 'mains') && notes.mainsAnswerFramework && (
          <MainsAnswerFrameworkCard framework={notes.mainsAnswerFramework} />
        )}

        {/* 8. High Yield Facts */}
        {(activeFilter === 'all' || activeFilter === 'facts') && notes.highYieldFacts && (
          <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-lg space-y-3">
            <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
              <span className="text-lg">⭐</span>
              <h4 className="text-sm sm:text-base font-bold text-white">
                BPSC प्रारंभिक परीक्षा: 1-पंक्ति तथ्य (High-Yield Facts)
              </h4>
            </div>

            <ul className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              {notes.highYieldFacts.map((fact, idx) => (
                <li
                  key={idx}
                  className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80 text-xs text-slate-200 flex items-start gap-2"
                >
                  <span className="text-amber-400 font-bold shrink-0">#{idx + 1}</span>
                  <span className="leading-relaxed">{fact}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
