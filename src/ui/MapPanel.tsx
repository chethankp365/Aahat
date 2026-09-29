import React, { useState } from 'react';
import { useSimStore } from '../state/simStore';
import { Map, Navigation, MapPin } from 'lucide-react';

export function MapPanel() {
  const trackSpline = useSimStore((s) => s.trackSpline);
  const trackLength = useSimStore((s) => s.trackLength);
  const vehicleProgress = useSimStore((s) => s.vehicleProgress);
  const setVehicleProgress = useSimStore((s) => s.setVehicleProgress);
  const getActiveDefects = useSimStore((s) => s.getActiveDefects);
  const selectedDefectId = useSimStore((s) => s.selectedDefectId);
  const selectDefect = useSimStore((s) => s.selectDefect);

  const [hoveredDefectId, setHoveredDefectId] = useState<string | null>(null);

  if (!trackSpline) return null;

  const activeDefects = getActiveDefects();

  // Generate 2D SVG track path projection from 3D spline control points
  const points: { x: number; y: number; u: number }[] = [];
  const samples = 100;
  for (let i = 0; i <= samples; i++) {
    const u = i / samples;
    const pt = trackSpline.getPointAt(u);
    // Project 3D (X, Z) onto 2D SVG box [20, 270] x [20, 140]
    const x2d = 25 + (pt.x / 420) * 240;
    const y2d = 135 + (pt.z / 480) * 105;
    points.push({ x: x2d, y: y2d, u });
  }

  const svgPathD = points.reduce((acc, p, idx) => {
    return idx === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`;
  }, '');

  // Vehicle 2D map position
  const vehPt = trackSpline.getPointAt(vehicleProgress);
  const vehX = 25 + (vehPt.x / 420) * 240;
  const vehY = 135 + (vehPt.z / 480) * 105;

  const activeHoverDefect = activeDefects.find((d) => d.id === hoveredDefectId) || activeDefects.find((d) => d.id === selectedDefectId);

  return (
    <div className="flex flex-col h-full bg-slate-900/90 backdrop-blur-lg border border-slate-800 rounded-2xl shadow-2xl overflow-hidden font-sans select-none">
      {/* Header */}
      <div className="p-3 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between">
        <h2 className="text-xs font-bold tracking-wider text-slate-200 uppercase flex items-center gap-2 font-mono">
          <Map className="w-4 h-4 text-cyan-400" />
          2D TOP-DOWN GIS MINI-MAP
        </h2>
        <span className="text-[10px] font-mono text-cyan-300">
          TRACK: {(vehicleProgress * trackLength).toFixed(1)}m / {trackLength.toFixed(0)}m
        </span>
      </div>

      {/* SVG Map Container */}
      <div className="relative flex-1 p-2 bg-slate-950/80 flex items-center justify-center">
        <svg className="w-full h-full min-h-[140px]" viewBox="0 0 300 160">
          {/* Outer Grid Grid Lines */}
          <line x1="0" y1="40" x2="300" y2="40" stroke="#1e293b" strokeWidth="0.5" strokeDasharray="2 2" />
          <line x1="0" y1="80" x2="300" y2="80" stroke="#1e293b" strokeWidth="0.5" strokeDasharray="2 2" />
          <line x1="0" y1="120" x2="300" y2="120" stroke="#1e293b" strokeWidth="0.5" strokeDasharray="2 2" />
          <line x1="100" y1="0" x2="100" y2="160" stroke="#1e293b" strokeWidth="0.5" strokeDasharray="2 2" />
          <line x1="200" y1="0" x2="200" y2="160" stroke="#1e293b" strokeWidth="0.5" strokeDasharray="2 2" />

          {/* Track Spline Path Shadow & Outline */}
          <path d={svgPathD} fill="none" stroke="#334155" strokeWidth="6" strokeLinecap="round" />
          <path d={svgPathD} fill="none" stroke="#0284c7" strokeWidth="2.5" strokeDasharray="5 3" />

          {/* Defect Markers on Map */}
          {activeDefects.map((defect) => {
            const u = defect.distance / trackLength;
            const pt = trackSpline.getPointAt(u);
            const dx = 25 + (pt.x / 420) * 240;
            const dy = 135 + (pt.z / 480) * 105;
            const isSelected = selectedDefectId === defect.id;

            const colorHex =
              defect.severity === 'critical'
                ? '#ef4444' // Red
                : defect.severity === 'high'
                ? '#f97316' // Orange
                : defect.severity === 'medium'
                ? '#eab308' // Yellow
                : defect.severity === 'low'
                ? '#06b6d4' // Cyan
                : '#10b981'; // Green

            return (
              <g
                key={defect.id}
                onMouseEnter={() => setHoveredDefectId(defect.id)}
                onMouseLeave={() => setHoveredDefectId(null)}
                onClick={(e) => {
                  e.stopPropagation();
                  selectDefect(defect.id);
                  setVehicleProgress(u);
                }}
                className="cursor-pointer group"
              >
                <circle cx={dx} cy={dy} r={isSelected ? 7 : 5} fill={colorHex} className="animate-pulse" />
                <circle cx={dx} cy={dy} r={isSelected ? 11 : 8} fill="none" stroke={colorHex} strokeWidth="1.5" opacity="0.8" />
                
                {/* Pin Text Label */}
                <text x={dx + 8} y={dy - 6} fill="#e2e8f0" fontSize="8" fontFamily="monospace" fontWeight="bold">
                  {defect.id}
                </text>
              </g>
            );
          })}

          {/* Inspection Vehicle Marker on Map */}
          <g transform={`translate(${vehX}, ${vehY})`}>
            <circle r="8" fill="#38bdf8" className="animate-ping opacity-75" />
            <circle r="5.5" fill="#0284c7" stroke="#ffffff" strokeWidth="1.5" />
          </g>
        </svg>

        {/* Hover / Selected Defect GPS Pseudo-Coordinates & KM Marker Overlay */}
        {activeHoverDefect && (
          <div className="absolute top-2 left-2 right-2 px-2.5 py-1.5 rounded-lg bg-slate-950/90 border border-cyan-500/50 text-[10px] font-mono flex items-center justify-between text-slate-200 shadow-xl">
            <div className="flex items-center gap-1.5 text-cyan-300 font-bold">
              <MapPin className="w-3 h-3 text-rose-400" />
              <span>{activeHoverDefect.id}: KM {activeHoverDefect.locationKm.toFixed(3)}</span>
              {activeHoverDefect.status !== 'unseen' && activeHoverDefect.status !== 'detected' && (
                <span className="uppercase text-[8px] font-bold px-1 rounded bg-indigo-950 text-indigo-300 border border-indigo-500/40 ml-1">
                  [{activeHoverDefect.status.replace(/_/g, ' ')}]
                </span>
              )}
            </div>
            <div className="text-slate-400">
              GPS: <strong className="text-emerald-300">{(12.9716 + activeHoverDefect.locationKm * 0.05).toFixed(4)}° N, {(77.5946 + activeHoverDefect.locationKm * 0.08).toFixed(4)}° E</strong>
            </div>
          </div>
        )}

        {/* Legend Overlay */}
        <div className="absolute bottom-2 left-2 flex items-center gap-3 px-2.5 py-1 rounded-lg bg-slate-900/90 border border-slate-800 text-[10px] font-mono text-slate-400">
          <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-cyan-400" /> Vehicle</div>
          <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500" /> Critical</div>
          <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-400" /> Warning</div>
        </div>
      </div>
    </div>
  );
}
