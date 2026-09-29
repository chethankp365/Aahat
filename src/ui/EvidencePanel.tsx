import React, { useState, useMemo } from 'react';
import { useSimStore } from '../state/simStore';
import {
  generateVibrationWaveform,
  generateAcousticSpectrum,
  generateLaserProfile,
  generateThermalMatrix,
} from '../sim/sensorSignals';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, BarChart, Bar, LineChart, Line } from 'recharts';
import { Camera, Activity, Zap, Radio, Thermometer, Eye, Scan, Target, AlertTriangle } from 'lucide-react';

export function EvidencePanel() {
  const [activeTab, setActiveTab] = useState<'all' | 'vision' | 'vibration' | 'acoustic' | 'laser'>('all');

  const telemetry = useSimStore((s) => s.telemetry);
  const vehicleSpeed = useSimStore((s) => s.vehicleSpeedKmH);
  const vehicleProgress = useSimStore((s) => s.vehicleProgress);
  const trackLength = useSimStore((s) => s.trackLength);
  const getActiveDefects = useSimStore((s) => s.getActiveDefects);

  const activeDefects = getActiveDefects();
  const currentDistM = vehicleProgress * trackLength;

  // Check if vehicle is near a defect (within 6m)
  const nearbyDefect = activeDefects.find((d) => Math.abs(d.distance - currentDistM) < 6.0);

  // Generate live sensor signals
  const vibData = useMemo(() => generateVibrationWaveform(telemetry.vibrationG, vehicleSpeed), [telemetry.vibrationG, vehicleSpeed, vehicleProgress]);
  const acousticData = useMemo(() => generateAcousticSpectrum(telemetry.acousticDb), [telemetry.acousticDb, vehicleProgress]);
  const laserData = useMemo(() => generateLaserProfile(telemetry.gaugeDevMm), [telemetry.gaugeDevMm]);
  const thermalData = useMemo(() => generateThermalMatrix(telemetry.railTempC), [telemetry.railTempC]);

  return (
    <div className="flex flex-col h-full bg-slate-900/90 backdrop-blur-lg border border-slate-800 rounded-2xl shadow-2xl overflow-hidden font-sans select-none">
      {/* Header & Tabs */}
      <div className="p-3.5 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between">
        <h2 className="text-xs font-bold tracking-wider text-slate-200 uppercase flex items-center gap-2 font-mono">
          <Activity className="w-4 h-4 text-cyan-400 animate-pulse" />
          Synchronized Live Sensor Streams
        </h2>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1 font-mono text-[11px]">
          {(['all', 'vision', 'vibration', 'acoustic', 'laser'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-2 py-1 rounded-lg capitalize transition-all ${
                activeTab === tab
                  ? 'bg-cyan-500 text-slate-950 font-bold shadow'
                  : 'bg-slate-950/60 text-slate-400 border border-slate-800 hover:text-slate-200'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Grid Container */}
      <div className="flex-1 p-3 overflow-y-auto custom-scrollbar grid grid-cols-1 md:grid-cols-2 gap-3">
        
        {/* 1. VISION COMPUTER VISION FEED WINDOW */}
        {(activeTab === 'all' || activeTab === 'vision') && (
          <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-col relative overflow-hidden">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 text-xs font-mono text-cyan-300">
                <Camera className="w-3.5 h-3.5 text-cyan-400" />
                VISION AI OPTICAL FEED [FRONT CAM]
              </div>
              <span className="text-[10px] font-mono text-emerald-400 font-bold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" /> YOLO-V9 ACTIVE
              </span>
            </div>

            {/* Stylized Optical Video Feed Canvas Box */}
            <div className="relative h-36 w-full rounded-lg bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 border border-slate-800 flex items-center justify-center overflow-hidden">
              {/* Grid Background Pattern */}
              <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:20px_20px] opacity-30" />

              {/* Animated Horizontal Scanline */}
              <div className="absolute inset-0 bg-gradient-to-b from-cyan-500/10 via-transparent to-transparent animate-pulse pointer-events-none" />

              {/* Center Reticle Target */}
              <div className="absolute w-16 h-16 border border-cyan-500/30 rounded-full flex items-center justify-center pointer-events-none">
                <div className="w-2 h-2 bg-cyan-400 rounded-full opacity-60" />
              </div>

              {/* 2D Rail Head Graphic Simulation */}
              <div className="w-36 h-full border-x-4 border-slate-600/50 bg-slate-900/40 relative flex items-center justify-center">
                {/* Moving Sleeper Ties effect */}
                <div
                  className="absolute inset-0 flex flex-col justify-between py-2 transition-all"
                  style={{ transform: `translateY(${(vehicleProgress * 300) % 30}px)` }}
                >
                  <div className="w-full h-1.5 bg-slate-700/60" />
                  <div className="w-full h-1.5 bg-slate-700/60" />
                  <div className="w-full h-1.5 bg-slate-700/60" />
                </div>

                {/* Bounding Box Highlight snapping onto Defect when nearby */}
                {nearbyDefect && (
                  <div className="absolute z-10 p-2 rounded-lg border-2 border-dashed border-rose-500 bg-rose-950/80 text-rose-200 animate-pulse flex flex-col items-center shadow-lg shadow-rose-950/50">
                    <div className="flex items-center gap-1 text-[10px] font-mono font-bold bg-rose-900 px-1.5 py-0.5 rounded text-rose-100 uppercase">
                      <Target className="w-3 h-3 text-amber-300" />
                      {nearbyDefect.title}
                    </div>
                    <div className="text-[10px] font-mono mt-1 text-cyan-300 font-bold">
                      CONFIDENCE: 94.8%
                    </div>
                  </div>
                )}
              </div>

              {/* Bottom Telemetry Overlay */}
              <div className="absolute bottom-1.5 left-2 right-2 flex items-center justify-between text-[10px] font-mono text-slate-400 bg-slate-950/80 px-2 py-0.5 rounded border border-slate-800">
                <span>Dist: <strong className="text-cyan-300">{currentDistM.toFixed(1)}m</strong></span>
                <span>Speed: <strong className="text-cyan-300">{vehicleSpeed.toFixed(0)} km/h</strong></span>
              </div>
            </div>
          </div>
        )}

        {/* 2. VIBRATION ACCELEROMETER WAVEFORM */}
        {(activeTab === 'all' || activeTab === 'vibration') && (
          <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-col">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 text-xs font-mono text-cyan-300">
                <Activity className="w-3.5 h-3.5 text-cyan-400" />
                VIBRATION ACCELEROMETER WAVEFORM (G)
              </div>
              <span className={`text-xs font-mono font-bold ${nearbyDefect ? 'text-rose-400 animate-pulse' : 'text-cyan-400'}`}>
                {telemetry.vibrationG.toFixed(2)} G {nearbyDefect && '[SPIKE DETECTED]'}
              </span>
            </div>
            <div className="h-36 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={vibData}>
                  <defs>
                    <linearGradient id="vibGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={nearbyDefect ? '#f43f5e' : '#06b6d4'} stopOpacity={0.6} />
                      <stop offset="95%" stopColor={nearbyDefect ? '#f43f5e' : '#06b6d4'} stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="timeMs" stroke="#475569" fontSize={9} />
                  <YAxis stroke="#475569" fontSize={9} domain={[0, 4.5]} />
                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', fontSize: '11px' }} />
                  <Area type="monotone" dataKey="accelG" stroke={nearbyDefect ? '#f43f5e' : '#06b6d4'} strokeWidth={2} fillOpacity={1} fill="url(#vibGrad)" />
                  <Line type="monotone" dataKey="threshold" stroke="#ef4444" strokeDasharray="3 3" strokeWidth={1} dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* 3. ACOUSTIC EMISSION SPECTRUM */}
        {(activeTab === 'all' || activeTab === 'acoustic') && (
          <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-col">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 text-xs font-mono text-purple-300">
                <Zap className="w-3.5 h-3.5 text-purple-400" />
                ACOUSTIC FFT SPECTROGRAM (dB)
              </div>
              <span className={`text-xs font-mono font-bold ${nearbyDefect ? 'text-purple-300 animate-pulse' : 'text-purple-400'}`}>
                {telemetry.acousticDb.toFixed(1)} dB {nearbyDefect && '[ANOMALOUS NOISE BURST]'}
              </span>
            </div>
            <div className="h-36 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={acousticData}>
                  <XAxis dataKey="freqHz" stroke="#475569" fontSize={8} interval={1} />
                  <YAxis stroke="#475569" fontSize={9} domain={[0, 120]} />
                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', fontSize: '11px' }} />
                  <Bar dataKey="amplitudeDb" fill={nearbyDefect ? '#a855f7' : '#8b5cf6'} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* 4. LASER RAIL PROFILE CROSS-SECTION */}
        {(activeTab === 'all' || activeTab === 'laser') && (
          <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-col">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 text-xs font-mono text-emerald-300">
                <Radio className="w-3.5 h-3.5 text-emerald-400" />
                LASER CROWN PROFILE (mm)
              </div>
              <span className="text-xs font-mono font-bold text-emerald-400">Dev: {telemetry.gaugeDevMm > 0 ? `+${telemetry.gaugeDevMm}` : telemetry.gaugeDevMm} mm</span>
            </div>
            <div className="h-36 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={laserData}>
                  <XAxis dataKey="xMm" stroke="#475569" fontSize={9} />
                  <YAxis stroke="#475569" fontSize={9} domain={[25, 45]} />
                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', fontSize: '11px' }} />
                  <Line type="monotone" dataKey="nominalY" stroke="#64748b" strokeDasharray="4 4" strokeWidth={1.5} dot={false} />
                  <Line type="monotone" dataKey="yMm" stroke="#10b981" strokeWidth={2.5} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
