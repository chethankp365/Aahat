import React from 'react';
import { useSimStore } from '../state/simStore';
import { generateDiagnosticExplanation } from '../sim/riskEngine';
import { AlertCircle, CheckCircle2, Navigation, Filter, Eye, Sparkles } from 'lucide-react';

export function AlertPanel() {
  const getActiveDefects = useSimStore((s) => s.getActiveDefects);
  const selectedDefectId = useSimStore((s) => s.selectedDefectId);
  const filterSeverity = useSimStore((s) => s.filterSeverity);
  const selectDefect = useSimStore((s) => s.selectDefect);
  const acknowledgeDefect = useSimStore((s) => s.acknowledgeDefect);
  const setFilterSeverity = useSimStore((s) => s.setFilterSeverity);
  const setVehicleProgress = useSimStore((s) => s.setVehicleProgress);
  const trackLength = useSimStore((s) => s.trackLength);

  const activeDefects = getActiveDefects();

  const filteredDefects = activeDefects.filter((d) => {
    if (filterSeverity === 'all') return true;
    return d.severity === filterSeverity;
  });

  return (
    <div className="flex flex-col h-full bg-slate-900/90 backdrop-blur-lg border border-slate-800 rounded-2xl shadow-2xl overflow-hidden font-sans select-none">
      {/* Header & Filter Toolbar */}
      <div className="p-4 border-b border-slate-800 bg-slate-950/50 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold tracking-wider text-slate-100 uppercase flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-cyan-400" />
            AI Detection Feed ({filteredDefects.length})
          </h2>
          <span className="px-2 py-0.5 text-xs font-mono rounded-full bg-cyan-950 text-cyan-300 border border-cyan-500/30 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-cyan-400" /> Natural AI Explanations
          </span>
        </div>

        {/* Severity Filter Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 text-xs">
          <Filter className="w-3.5 h-3.5 text-slate-400 mr-1" />
          {(['all', 'critical', 'high', 'medium', 'low', 'normal'] as const).map((sev) => (
            <button
              key={sev}
              onClick={() => setFilterSeverity(sev)}
              className={`px-2.5 py-1 rounded-lg font-mono text-[11px] capitalize transition-all whitespace-nowrap ${
                filterSeverity === sev
                  ? 'bg-cyan-500 text-slate-950 font-bold shadow-md shadow-cyan-500/20'
                  : 'bg-slate-950/60 text-slate-400 border border-slate-800 hover:text-slate-200'
              }`}
            >
              {sev}
            </button>
          ))}
        </div>
      </div>

      {/* Alert Feed List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2.5 custom-scrollbar">
        {filteredDefects.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500 font-mono">
            No defect alerts matching filter criteria.
          </div>
        ) : (
          filteredDefects.map((defect) => {
            const isSelected = selectedDefectId === defect.id;
            const isCritical = defect.severity === 'critical';
            const isHigh = defect.severity === 'high';

            const severityBadgeColor = isCritical
              ? 'bg-red-950 text-red-400 border-red-500/40'
              : isHigh
              ? 'bg-amber-950 text-amber-400 border-amber-500/40'
              : defect.severity === 'medium'
              ? 'bg-yellow-950 text-yellow-400 border-yellow-500/40'
              : defect.severity === 'low'
              ? 'bg-cyan-950 text-cyan-400 border-cyan-500/40'
              : 'bg-emerald-950 text-emerald-400 border-emerald-500/40';

            // Generate Programmatic Natural Language Diagnostic Explanation
            const explanationSentence = generateDiagnosticExplanation(
              defect.title,
              94.8,
              defect.acousticDb,
              defect.vibrationG
            );

            return (
              <div
                key={defect.id}
                onClick={() => selectDefect(defect.id)}
                className={`p-3 rounded-xl border transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-slate-800/90 border-cyan-400/80 ring-1 ring-cyan-400/40 shadow-lg'
                    : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700 hover:bg-slate-900/60'
                }`}
              >
                {/* Top Title Bar */}
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 text-[10px] font-mono font-bold uppercase rounded border ${severityBadgeColor}`}>
                      {defect.severity}
                    </span>
                    <span className="text-xs font-mono font-bold text-slate-200">{defect.id}</span>
                  </div>
                  <span className="text-[11px] font-mono text-cyan-400">
                    KM {defect.locationKm.toFixed(3)}
                  </span>
                </div>

                {/* Defect Title */}
                <h3 className="text-xs font-bold text-white mb-1">{defect.title}</h3>
                
                {/* Programmatic Plain-Language Sensor Explanation */}
                <p className="text-[11px] text-slate-300 leading-relaxed mb-2.5 font-sans bg-slate-900/80 p-2 rounded border border-slate-800/80">
                  {explanationSentence}
                </p>

                {/* Action Buttons */}
                <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-800/60">
                  {/* Jump to 3D Location */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      selectDefect(defect.id);
                      setVehicleProgress(defect.distance / trackLength);
                    }}
                    className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-mono text-cyan-300 bg-cyan-950/60 hover:bg-cyan-900/80 border border-cyan-500/40 rounded-lg transition-colors"
                  >
                    <Navigation className="w-3 h-3" />
                    Locate on 3D
                  </button>

                  {/* Acknowledge / Confirm Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      acknowledgeDefect(defect.id);
                    }}
                    disabled={defect.status === 'confirmed'}
                    className={`flex items-center gap-1 px-2.5 py-1 text-[11px] font-mono rounded-lg transition-colors ${
                      defect.status === 'confirmed'
                        ? 'bg-slate-900 text-emerald-400 border border-emerald-500/30 cursor-default'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
                    }`}
                  >
                    <CheckCircle2 className="w-3 h-3" />
                    {defect.status === 'confirmed' ? 'CONFIRMED' : 'Confirm'}
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
