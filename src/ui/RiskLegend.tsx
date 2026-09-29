import React, { useState } from 'react';
import { Shield, ChevronDown, ChevronUp, Sparkles, AlertCircle } from 'lucide-react';

export function RiskLegend() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="absolute bottom-20 left-4 z-20 pointer-events-auto">
      <div className="bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-xl shadow-xl overflow-hidden transition-all duration-200 w-52">
        {/* Title Header */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="w-full px-3 py-2 bg-slate-950/70 hover:bg-slate-800/50 transition flex items-center justify-between border-b border-slate-800 text-xs font-semibold text-slate-200"
        >
          <div className="flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-cyan-400" />
            <span>Risk Categories</span>
          </div>
          {collapsed ? <ChevronUp className="w-3.5 h-3.5 text-slate-400" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-400" />}
        </button>

        {/* Legend Body */}
        {!collapsed && (
          <div className="p-2.5 space-y-1.5 text-[11px]">
            <div className="flex items-center justify-between px-1 py-0.5 rounded hover:bg-slate-800/40">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-sm shadow-emerald-500/50"></span>
                <span className="text-slate-300 font-medium">Normal</span>
              </div>
              <span className="font-mono text-[10px] text-slate-400">&lt; 28%</span>
            </div>

            <div className="flex items-center justify-between px-1 py-0.5 rounded hover:bg-slate-800/40">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-sm shadow-cyan-500/50"></span>
                <span className="text-slate-300 font-medium">Monitor</span>
              </div>
              <span className="font-mono text-[10px] text-slate-400">28 - 51%</span>
            </div>

            <div className="flex items-center justify-between px-1 py-0.5 rounded hover:bg-slate-800/40">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shadow-sm shadow-amber-500/50"></span>
                <span className="text-slate-300 font-medium">Warning</span>
              </div>
              <span className="font-mono text-[10px] text-slate-400">52 - 77%</span>
            </div>

            <div className="flex items-center justify-between px-1 py-0.5 rounded hover:bg-slate-800/40">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-sm shadow-rose-500/50 animate-pulse"></span>
                <span className="text-slate-300 font-medium">Critical</span>
              </div>
              <span className="font-mono text-[10px] text-slate-400">78 - 100%</span>
            </div>

            <div className="border-t border-slate-800 pt-1.5 mt-1 space-y-1">
              <div className="flex items-center gap-1.5 text-[10px] text-emerald-400">
                <Sparkles className="w-3 h-3 text-emerald-400" />
                <span>Multi-Sensor Halo (2+ agreement)</span>
              </div>
              <div className="flex items-center gap-1.5 text-[10px] text-cyan-300">
                <span className="w-2 h-2 rounded-full border border-cyan-400 border-dashed"></span>
                <span>Ghost Ring = Predictive Forecast</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
