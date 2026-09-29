import React from 'react';
import { useSimStore } from '../state/simStore';
import { ShieldCheck, AlertTriangle, CheckCircle2, BarChart3, Activity } from 'lucide-react';

export function AnalyticsStrip() {
  const getActiveDefects = useSimStore((s) => s.getActiveDefects);
  const currentPassNumber = useSimStore((s) => s.currentPassNumber);

  const activeDefects = getActiveDefects();

  const totalFound = activeDefects.length;
  const criticalCount = activeDefects.filter((d) => d.severity === 'critical' && d.status !== 'resolved').length;
  const resolvedCount = activeDefects.filter((d) => d.status === 'resolved' || d.status === 'repaired').length;

  // Calculate overall Route Track Health Score Index (0 to 100%)
  // Recalculates dynamically as passes progress and defects degrade/resolve
  let penalty = 0;
  activeDefects.forEach((d) => {
    if (d.status !== 'resolved') {
      if (d.severity === 'critical') penalty += 18;
      else if (d.severity === 'high') penalty += 10;
      else if (d.severity === 'medium') penalty += 5;
      else if (d.severity === 'low') penalty += 2;
    }
  });

  const overallHealthScore = Math.max(30, Math.min(100, Math.round(98 - penalty)));

  let healthColor = 'text-emerald-400 border-emerald-500/60 shadow-emerald-500/20';
  if (overallHealthScore < 80) healthColor = 'text-amber-400 border-amber-500/60 shadow-amber-500/20';
  if (overallHealthScore < 60) healthColor = 'text-rose-400 border-rose-500/80 shadow-rose-950/60 animate-pulse';

  return (
    <div className="w-full bg-slate-900/90 backdrop-blur-lg border border-slate-800 rounded-2xl p-3 shadow-2xl font-mono text-slate-100 flex items-center justify-between gap-4 select-none">
      {/* Route Health Score Gauge */}
      <div className="flex items-center gap-3">
        <div className={`w-12 h-12 rounded-2xl border-2 ${healthColor} flex items-center justify-center text-base font-extrabold bg-slate-950/90 shadow-lg`}>
          {overallHealthScore}%
        </div>
        <div>
          <div className="text-[10px] uppercase text-slate-400 font-bold tracking-wider">
            Overall Route Health Index
          </div>
          <div className="text-xs font-bold text-slate-200">
            {overallHealthScore >= 80 ? (
              <span className="text-emerald-400">OPTIMAL TRACK CONDITION</span>
            ) : overallHealthScore >= 60 ? (
              <span className="text-amber-400">MAINTENANCE RECOMMENDED</span>
            ) : (
              <span className="text-rose-400 font-extrabold">CRITICAL HAZARD WARNING</span>
            )}
          </div>
        </div>
      </div>

      {/* Analytics Counter Grid */}
      <div className="flex items-center gap-3 text-xs">
        {/* Total Defects */}
        <div className="px-3 py-1.5 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-cyan-400" />
          <div>
            <div className="text-[9px] uppercase text-slate-400">Total Anomalies</div>
            <div className="font-bold text-slate-100">{totalFound}</div>
          </div>
        </div>

        {/* Critical Count */}
        <div className="px-3 py-1.5 rounded-xl bg-rose-950/70 border border-rose-500/40 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-rose-400" />
          <div>
            <div className="text-[9px] uppercase text-rose-300">Critical Risks</div>
            <div className="font-bold text-rose-400">{criticalCount}</div>
          </div>
        </div>

        {/* Resolved Count */}
        <div className="px-3 py-1.5 rounded-xl bg-emerald-950/70 border border-emerald-500/40 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <div>
            <div className="text-[9px] uppercase text-emerald-300">Resolved / Repaired</div>
            <div className="font-bold text-emerald-400">{resolvedCount}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
