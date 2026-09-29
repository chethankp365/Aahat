import React from 'react';
import { useSimStore } from '../state/simStore';
import { Activity, Gauge, Radio, Thermometer, Zap, ShieldCheck } from 'lucide-react';

export function LiveMonitoringPanel() {
  const telemetry = useSimStore((s) => s.telemetry);
  const vehicleSpeed = useSimStore((s) => s.vehicleSpeedKmH);
  const vehicleProgress = useSimStore((s) => s.vehicleProgress);
  const trackLength = useSimStore((s) => s.trackLength);

  const currentKm = ((vehicleProgress * trackLength) / 1000).toFixed(3);

  return (
    <div className="flex flex-col h-full bg-slate-900/90 backdrop-blur-lg border border-slate-800 rounded-2xl shadow-2xl overflow-hidden font-mono select-none text-slate-100 p-4 space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-800 text-xs">
        <div className="flex items-center gap-2 text-cyan-300 font-bold">
          <Activity className="w-4 h-4 text-cyan-400 animate-pulse" />
          <span>LIVE MONITORING TELEMETRY</span>
        </div>
        <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" /> STREAMING
        </span>
      </div>

      {/* Primary Metrics */}
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800">
          <div className="text-[10px] text-slate-400">Position</div>
          <div className="text-sm font-bold text-cyan-300 mt-0.5">KM {currentKm}</div>
        </div>
        <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800">
          <div className="text-[10px] text-slate-400">Trolley Speed</div>
          <div className="text-sm font-bold text-slate-100 mt-0.5">{vehicleSpeed.toFixed(0)} <span className="text-[10px] text-slate-400 font-normal">km/h</span></div>
        </div>
      </div>

      {/* Mini Live Sensor Numbers Grid */}
      <div className="space-y-2">
        <div className="text-[10px] uppercase text-slate-400 font-bold tracking-wider">
          Real-Time Sensor Values
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs">
          {/* Vibration G */}
          <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-slate-300">
              <Activity className="w-3.5 h-3.5 text-cyan-400" /> Vib G
            </div>
            <span className="font-bold text-cyan-300">{telemetry.vibrationG.toFixed(2)} G</span>
          </div>

          {/* Acoustic dB */}
          <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-slate-300">
              <Zap className="w-3.5 h-3.5 text-purple-400" /> Acoustic
            </div>
            <span className="font-bold text-purple-300">{telemetry.acousticDb.toFixed(1)} dB</span>
          </div>

          {/* Gauge Dev mm */}
          <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-slate-300">
              <Radio className="w-3.5 h-3.5 text-emerald-400" /> Gauge
            </div>
            <span className="font-bold text-emerald-300">+{telemetry.gaugeDevMm} mm</span>
          </div>

          {/* Temp °C */}
          <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-slate-300">
              <Thermometer className="w-3.5 h-3.5 text-orange-400" /> Rail Temp
            </div>
            <span className="font-bold text-orange-300">{telemetry.railTempC.toFixed(1)}°C</span>
          </div>
        </div>
      </div>
    </div>
  );
}
