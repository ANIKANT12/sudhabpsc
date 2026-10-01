import React from 'react';
import {
  GitCommit,
  ArrowRight,
  Calendar,
  Sparkles,
  BookOpen,
  Award,
  MapPin,
  HelpCircle,
  CheckCircle2,
  AlertCircle,
  FileText,
  Star,
  Layers,
} from 'lucide-react';

/**
 * 1. Napkin-AI Inspired Flowchart Visual Renderer
 */
export function FlowchartVisual({ diagram }) {
  if (!diagram || !diagram.nodes || diagram.nodes.length === 0) return null;

  const getCategoryStyle = (cat) => {
    switch (cat) {
      case 'cause':
        return 'border-amber-500/40 bg-gradient-to-br from-amber-950/40 to-slate-900 text-amber-200';
      case 'immediate':
        return 'border-rose-500/50 bg-gradient-to-br from-rose-950/50 to-slate-900 text-rose-200 shadow-rose-900/20';
      case 'event':
        return 'border-blue-500/40 bg-gradient-to-br from-blue-950/40 to-slate-900 text-blue-200';
      case 'result':
        return 'border-emerald-500/40 bg-gradient-to-br from-emerald-950/40 to-slate-900 text-emerald-200';
      default:
        return 'border-purple-500/40 bg-gradient-to-br from-purple-950/40 to-slate-900 text-purple-200';
    }
  };

  const getCategoryBadge = (cat) => {
    switch (cat) {
      case 'cause':
        return <span className="px-1.5 py-0.5 rounded text-[10px] bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30">कारण</span>;
      case 'immediate':
        return <span className="px-1.5 py-0.5 rounded text-[10px] bg-rose-500/20 text-rose-300 font-bold border border-rose-500/30">तात्कालिक</span>;
      case 'event':
        return <span className="px-1.5 py-0.5 rounded text-[10px] bg-blue-500/20 text-blue-300 font-bold border border-blue-500/30">घटनाक्रम</span>;
      case 'result':
        return <span className="px-1.5 py-0.5 rounded text-[10px] bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">परिणाम</span>;
      default:
        return <span className="px-1.5 py-0.5 rounded text-[10px] bg-purple-500/20 text-purple-300 font-bold border border-purple-500/30">स्तंभ</span>;
    }
  };

  return (
    <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-lg space-y-4">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-blue-500/20 text-blue-400 border border-blue-500/30">
            <Layers className="w-4 h-4" />
          </div>
          <h4 className="text-sm sm:text-base font-bold text-white">
            {diagram.title || 'संकल्पना आरेख (Flowchart)'}
          </h4>
        </div>
        <span className="text-[11px] text-slate-400 font-medium">Napkin Visual</span>
      </div>

      {/* Nodes display */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {diagram.nodes.map((node, idx) => (
          <div
            key={node.id || idx}
            className={`p-3.5 rounded-xl border relative shadow-md transition-all hover:scale-[1.02] flex flex-col justify-between ${getCategoryStyle(
              node.category
            )}`}
          >
            <div className="flex items-start justify-between gap-2 mb-2">
              <span className="text-xs font-bold">{node.label}</span>
              {getCategoryBadge(node.category)}
            </div>
            {node.subtext && (
              <p className="text-[11px] opacity-80 leading-relaxed">{node.subtext}</p>
            )}

            {/* Step sequence indicator */}
            <div className="mt-3 pt-2 border-t border-slate-700/50 flex items-center justify-between text-[10px] text-slate-400">
              <span>चरण {idx + 1}</span>
              {idx < diagram.nodes.length - 1 && (
                <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * 2. Vertical BPSC Chronology Timeline
 */
export function VerticalTimeline({ timeline }) {
  if (!timeline || timeline.length === 0) return null;

  return (
    <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-lg space-y-4">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30">
            <Calendar className="w-4 h-4" />
          </div>
          <h4 className="text-sm sm:text-base font-bold text-white">
            ऐतिहासिक कालक्रम एवं महत्वपूर्ण तिथियां (BPSC Timeline)
          </h4>
        </div>
        <span className="text-[11px] text-amber-400 font-semibold">
          {timeline.length} प्रमुख घटनाएं
        </span>
      </div>

      <div className="relative pl-6 space-y-6 before:content-[''] before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-gradient-to-b before:from-blue-500 before:via-amber-500 before:to-emerald-500">
        {timeline.map((item, idx) => (
          <div key={idx} className="relative group">
            {/* Timeline bullet dot */}
            <div
              className={`absolute -left-[27px] top-1.5 w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all ${
                item.biharContext
                  ? 'bg-amber-500 border-amber-300 ring-4 ring-amber-500/20'
                  : 'bg-blue-600 border-blue-400 ring-4 ring-blue-500/20'
              }`}
            >
              <div className="w-1.5 h-1.5 rounded-full bg-white"></div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 hover:border-slate-700 transition-all space-y-1.5">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-extrabold text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                    {item.dateOrYear}
                  </span>
                  <h5 className="text-xs sm:text-sm font-bold text-white">
                    {item.title}
                  </h5>
                </div>
                {item.biharContext && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                    <span>🟡 बिहार संदर्भ</span>
                  </span>
                )}
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">
                {item.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * 3. BPSC Comparison Table
 */
export function ComparisonTable({ table }) {
  if (!table || !table.headers || !table.rows) return null;

  return (
    <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-lg space-y-3 overflow-hidden">
      <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
        <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
          <BookOpen className="w-4 h-4" />
        </div>
        <h4 className="text-sm sm:text-base font-bold text-white">{table.title}</h4>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-800/80 text-slate-200 border-b border-slate-700">
              {table.headers.map((h, i) => (
                <th key={i} className="py-2.5 px-3 font-bold text-slate-300">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {table.rows.map((row, rIdx) => (
              <tr
                key={rIdx}
                className="hover:bg-slate-800/40 transition-colors odd:bg-slate-950/30"
              >
                {row.map((cell, cIdx) => (
                  <td
                    key={cIdx}
                    className={`py-2.5 px-3 text-slate-300 ${
                      cIdx === 0 ? 'font-semibold text-white' : ''
                    }`}
                  >
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/**
 * 4. Distinct Source Notes vs BPSC Value Add Section Card
 */
export function SectionAttributionCard({ section, index }) {
  if (!section) return null;

  return (
    <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-lg space-y-4">
      {/* Section Title */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
        <h4 className="text-base font-extrabold text-white flex items-center gap-2">
          <span className="w-6 h-6 rounded-lg bg-blue-600/20 text-blue-400 border border-blue-500/30 text-xs flex items-center justify-center font-bold">
            {index + 1}
          </span>
          <span>{section.title}</span>
        </h4>
      </div>

      {/* Grid: Source Notes (Sudha's copy) vs BPSC Value Add */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Sudha's Original Notes */}
        <div className="p-3.5 rounded-xl bg-emerald-950/20 border border-emerald-500/30 space-y-2">
          <div className="flex items-center gap-1.5 text-emerald-400 font-bold text-xs uppercase tracking-wider">
            <span className="text-sm">📝</span>
            <span>आपकी कॉपी से (From Your Notes)</span>
          </div>
          <ul className="space-y-1.5">
            {(() => {
              const srcNotes = Array.isArray(section.sourceNotes)
                ? section.sourceNotes
                : typeof section.sourceNotes === 'string'
                ? [section.sourceNotes]
                : [];
              return srcNotes.length > 0 ? (
                srcNotes.map((pt, pIdx) => (
                  <li key={pIdx} className="text-xs text-slate-200 flex items-start gap-2">
                    <span className="text-emerald-400 mt-0.5">•</span>
                    <span>{pt}</span>
                  </li>
                ))
              ) : (
                <li className="text-xs text-slate-400 italic">हस्तलिखित नोट्स से संकलित।</li>
              );
            })()}
          </ul>
        </div>

        {/* BPSC Value Addition */}
        <div className="p-3.5 rounded-xl bg-blue-950/20 border border-blue-500/30 space-y-2">
          <div className="flex items-center gap-1.5 text-blue-400 font-bold text-xs uppercase tracking-wider">
            <span className="text-sm">🌐</span>
            <span>BPSC मूल्य संवर्धन (Syllabus Context)</span>
          </div>
          <ul className="space-y-1.5">
            {(() => {
              const enrichNotes = Array.isArray(section.bpscEnrichment)
                ? section.bpscEnrichment
                : typeof section.bpscEnrichment === 'string'
                ? [section.bpscEnrichment]
                : [];
              return enrichNotes.length > 0 ? (
                enrichNotes.map((pt, pIdx) => (
                  <li key={pIdx} className="text-xs text-slate-200 flex items-start gap-2">
                    <span className="text-blue-400 mt-0.5">✦</span>
                    <span>{pt}</span>
                  </li>
                ))
              ) : (
                <li className="text-xs text-slate-400 italic">मानक BPSC संदर्भ।</li>
              );
            })()}
          </ul>
        </div>
      </div>

      {/* High-Yield PYQ Callout if present */}
      {section.bpscHighYield && (
        <div className="p-3 rounded-xl bg-gradient-to-r from-rose-950/30 to-amber-950/30 border border-rose-500/30 flex items-start gap-2 text-xs text-rose-200">
          <span className="text-base shrink-0 mt-0.5">🎯</span>
          <div>
            <span className="font-extrabold text-rose-300 mr-1.5">BPSC परीक्षा ध्यान दें:</span>
            <span>{section.bpscHighYield}</span>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * 5. Bihar Special Focus Card
 */
export function BiharSpecialGrid({ biharSpecial }) {
  if (!biharSpecial || biharSpecial.length === 0) return null;

  return (
    <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-amber-950/30 via-slate-900 to-slate-900 border border-amber-500/30 shadow-lg space-y-4">
      <div className="flex items-center justify-between border-b border-amber-500/20 pb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30">
            <Award className="w-4 h-4" />
          </div>
          <h4 className="text-sm sm:text-base font-bold text-white">
            🟡 बिहार विशेष संदर्भ एवं प्रमुख व्यक्तित्व (Bihar Special)
          </h4>
        </div>
        <span className="text-[11px] font-bold text-amber-400">BPSC अनिवार्य</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {biharSpecial.map((item, idx) => (
          <div
            key={idx}
            className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 hover:border-amber-500/40 transition-colors space-y-1.5"
          >
            <div className="flex items-center justify-between">
              <h5 className="text-xs sm:text-sm font-bold text-white">{item.name}</h5>
              {item.place && (
                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-800 text-slate-300 border border-slate-700 flex items-center gap-1">
                  <MapPin className="w-2.5 h-2.5 text-amber-400" />
                  {item.place}
                </span>
              )}
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">{item.role}</p>

            {item.bpscRelevance && (
              <div className="pt-2 border-t border-slate-800/80 text-[11px] text-amber-300/90 font-medium">
                ⭐ {item.bpscRelevance}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * 6. BPSC Mains Answer Framework
 */
export function MainsAnswerFrameworkCard({ framework }) {
  if (!framework || !framework.structure) return null;

  return (
    <div className="p-4 sm:p-5 rounded-2xl bg-purple-950/20 border border-purple-500/30 shadow-lg space-y-4">
      <div className="flex items-center justify-between border-b border-purple-500/20 pb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-purple-500/20 text-purple-400 border border-purple-500/30">
            <FileText className="w-4 h-4" />
          </div>
          <h4 className="text-sm sm:text-base font-bold text-white">
            🖋️ BPSC मुख्य परीक्षा (Mains) 38-अंक आदर्श उत्तर प्रारूप
          </h4>
        </div>
        <span className="text-[11px] font-bold text-purple-400">GS Paper-1/2</span>
      </div>

      {framework.question && (
        <div className="p-3 rounded-xl bg-slate-950/70 border border-purple-500/20 text-xs sm:text-sm text-purple-200 font-semibold leading-relaxed">
          <span className="text-amber-400 mr-1.5">संभावित प्रश्न:</span>
          "{framework.question}"
        </div>
      )}

      <div className="space-y-3">
        {(Array.isArray(framework.structure) ? framework.structure : []).map((part, pIdx) => {
          const pts = Array.isArray(part.points)
            ? part.points
            : typeof part.points === 'string'
            ? [part.points]
            : [];
          return (
            <div key={pIdx} className="p-3 rounded-xl bg-slate-950/50 border border-slate-800 space-y-1.5">
              <h5 className="text-xs font-bold text-purple-300">{part.part}</h5>
              <ul className="space-y-1">
                {pts.map((pt, idx) => (
                  <li key={idx} className="text-xs text-slate-300 flex items-start gap-1.5">
                    <span className="text-purple-400">•</span>
                    <span>{pt}</span>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </div>
  );
}
