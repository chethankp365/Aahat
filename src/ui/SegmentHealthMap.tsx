import React, { useState } from 'react';
import { useSimStore } from '../state/simStore';
import { ChevronDown, ChevronUp, Layers } from 'lucide-react';

type SegmentStatus = 'Healthy' | 'Monitor' | 'Warning' | 'Critical';

export function SegmentHealthMap() {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const getActiveDefects = useSimStore((s) => s.getActiveDefects);
  const trackLength = useSimStore((s) => s.trackLength);
  const vehicleProgress = useSimStore((s) => s.vehicleProgress);
  const setVehicleProgress = useSimStore((s) => s.setVehicleProgress);

  const activeDefects = getActiveDefects();
  const currentDistM = vehicleProgress * trackLength;

  // Divide 450m route into 5 segments (90m each)
  const segmentCount = 5;
  const segmentLenM = trackLength / segmentCount;
  const segmentLabels = ['Segment A', 'Segment B', 'Segment C', 'Segment D', 'Segment E'];

  const segments: {
    label: string;
    startM: number;
    endM: number;
    status: SegmentStatus;
    healthScore: number;
    defectCount: number;
    isVehicleHere: boolean;
  }[] = segmentLabels.map((label, idx) => {
    const startM = idx * segmentLenM;
    const endM = (idx + 1) * segmentLenM;

    const segDefects = activeDefects.filter(
      (d) => d.distance >= startM && d.distance < endM && d.status !== 'resolved'
    );

    let status: SegmentStatus = 'Healthy';
    let healthScore = 100;

    segDefects.forEach((d) => {
      if (d.severity === 'critical') {
        status = 'Critical';
        healthScore -= 35;
      } else if (d.severity === 'high' && (status as string) !== 'Critical') {
        status = 'Warning';
        healthScore -= 20;
      } else if (d.severity === 'medium' && (status as string) === 'Healthy') {
        status = 'Monitor';
        healthScore -= 10;
      } else if (d.severity === 'low' && (status as string) === 'Healthy') {
        status = 'Monitor';
        healthScore -= 5;
      }
    });

    const isVehicleHere = currentDistM >= startM && currentDistM < endM;

    return {
      label,
      startM,
      endM,
      status,
      healthScore: Math.max(25, healthScore),
      defectCount: segDefects.length,
      isVehicleHere,
    };
  });

  return (
    <div className="w-full bg-slate-900/90 backdrop-blur-lg border border-slate-800 rounded-2xl shadow-2xl overflow-hidden font-mono text-slate-100 select-none">
      {/* Header Bar */}
      <div className="px-4 py-2 bg-slate-950/70 border-b border-slate-800 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2 text-cyan-300 font-bold">
          <Layers className="w-4 h-4 text-cyan-400" />
          <span>DIGITAL TRACK HEALTH MAP (ROUTE SEGMENTS)</span>
        </div>

        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors flex items-center gap-1 text-[11px]"
        >
          {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          <span>{isCollapsed ? 'Expand' : 'Collapse'}</span>
        </button>
      </div>

      {/* Segment Health Ribbon Bar */}
      {!isCollapsed && (
        <div className="p-3 flex items-center gap-2">
          {segments.map((seg, idx) => {
            const st: string = seg.status;
            let barColor = 'bg-emerald-500/30 border-emerald-500/60 text-emerald-300';
            if (st === 'Monitor') barColor = 'bg-cyan-500/30 border-cyan-500/60 text-cyan-300';
            if (st === 'Warning') barColor = 'bg-amber-500/30 border-amber-500/60 text-amber-300';
            if (st === 'Critical') barColor = 'bg-rose-500/40 border-rose-500/80 text-rose-300 animate-pulse';

            return (
              <div
                key={idx}
                onClick={() => setVehicleProgress((seg.startM + 10) / trackLength)}
                className={`flex-1 p-2.5 rounded-xl border ${barColor} cursor-pointer hover:scale-[1.02] transition-all relative flex flex-col justify-between h-16`}
                title={`Click to jump to ${seg.label} (${seg.startM.toFixed(0)}m - ${seg.endM.toFixed(0)}m)`}
              >
                <div className="flex items-center justify-between text-[11px] font-bold">
                  <span>{seg.label}</span>
                  <span className="text-[10px] font-normal opacity-80">{seg.healthScore}%</span>
                </div>

                <div className="flex items-center justify-between text-[10px]">
                  <span className="uppercase font-bold text-[9px]">{seg.status}</span>
                  <span className="opacity-75">{seg.defectCount} Anomaly</span>
                </div>

                {/* Live Vehicle Location Indicator */}
                {seg.isVehicleHere && (
                  <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 px-1.5 py-0.5 rounded-full bg-cyan-400 text-slate-950 text-[9px] font-extrabold shadow-md shadow-cyan-400/50 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-950 animate-ping" /> TROLLEY HERE
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
