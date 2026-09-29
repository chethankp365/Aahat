import React, { useState } from 'react';
import { useSimStore } from '../state/simStore';
import {
  X,
  Camera,
  Zap,
  Activity,
  Radio,
  Sliders,
  Play,
  Pause,
  AlertTriangle,
  CheckCircle2,
  Cpu,
  Layers,
  Sparkles,
} from 'lucide-react';

export function SensorDetailModal4D() {
  const selectedSensor4D = useSimStore((s) => s.selectedSensor4D);
  const setSelectedSensor4D = useSimStore((s) => s.setSelectedSensor4D);
  const currentPassNumber = useSimStore((s) => s.currentPassNumber);
  const setPassNumber = useSimStore((s) => s.setPassNumber);
  const isPlaying = useSimStore((s) => s.isPlaying);
  const togglePlay = useSimStore((s) => s.togglePlay);
  const telemetry = useSimStore((s) => s.telemetry);

  const [activeTab, setActiveTab] = useState<'optical' | 'acoustic' | 'accelerometer' | 'laser'>(
    selectedSensor4D === 'thermal' ? 'laser' : selectedSensor4D || 'optical'
  );

  // Sync tab with store state when modal opens
  React.useEffect(() => {
    if (selectedSensor4D && selectedSensor4D !== 'thermal') {
      setActiveTab(selectedSensor4D);
    }
  }, [selectedSensor4D]);

  if (!selectedSensor4D) return null;

  const sensorConfig = {
    optical: {
      title: '4D Optical Stereo Computer Vision Suite',
      subtitle: 'High-speed dual camera array (240 FPS) with dynamic AI defect segmenter',
      icon: Camera,
      color: 'sky',
      primaryMetric: '0.05 mm / pixel',
      secondaryMetric: '99.4% AI Accuracy',
      samplingRate: '240 Hz Stereo',
      wavelength: '450 nm Blue Laser Grid',
    },
    acoustic: {
      title: '4D Ultrasonic Acoustic Resonance Array',
      subtitle: 'Non-destructive ultrasonic acoustic emitter & piezo receiver array',
      icon: Zap,
      color: 'purple',
      primaryMetric: `${telemetry.acousticDb} dB`,
      secondaryMetric: '20 kHz - 80 kHz',
      samplingRate: '1000 Hz Continuous',
      wavelength: 'Sub-surface Echo Wave',
    },
    accelerometer: {
      title: '4D 3-Axis Piezoelectric IMU Accelerometer',
      subtitle: 'High-G axle-box acceleration and dynamic track stiffness sensor',
      icon: Activity,
      color: 'emerald',
      primaryMetric: `${telemetry.vibrationG} G`,
      secondaryMetric: `TQI: ${telemetry.tqi}`,
      samplingRate: '500 Hz Tri-axial',
      wavelength: 'X / Y / Z Acceleration',
    },
    laser: {
      title: '4D 360° LiDAR Track Profiler & Laser Scanner',
      subtitle: 'Multi-beam optical laser sheet measuring 1435mm rail gauge clearance',
      icon: Sliders,
      color: 'cyan',
      primaryMetric: `${1435 + telemetry.gaugeDevMm} mm`,
      secondaryMetric: `${telemetry.gaugeDevMm >= 0 ? '+' : ''}${telemetry.gaugeDevMm} mm Dev`,
      samplingRate: '1,200,000 Pts / sec',
      wavelength: '905 nm Infrared Pulse',
    },
  };

  const currentConfig = sensorConfig[activeTab];
  const Icon = currentConfig.icon;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md animate-fade-in select-none">
      <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 shadow-lg shadow-cyan-500/10">
              <Radio className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-bold text-base text-slate-100">{currentConfig.title}</h2>
                <span className="px-2 py-0.5 text-[10px] font-mono rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  4D Space-Time
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono mt-0.5">{currentConfig.subtitle}</p>
            </div>
          </div>

          <button
            onClick={() => setSelectedSensor4D(null)}
            className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher Bar */}
        <div className="flex items-center gap-2 px-6 py-3 border-b border-slate-800/80 bg-slate-950/30 overflow-x-auto">
          {(
            [
              { id: 'optical', label: 'Optical CV 4D', icon: Camera, color: 'text-sky-400' },
              { id: 'acoustic', label: 'Acoustic Array', icon: Zap, color: 'text-purple-400' },
              { id: 'accelerometer', label: 'IMU Accel 4D', icon: Activity, color: 'text-emerald-400' },
              { id: 'laser', label: 'LiDAR Laser', icon: Sliders, color: 'text-cyan-400' },
            ] as const
          ).map((tab) => {
            const TabIcon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl font-mono text-xs font-semibold transition-all border shrink-0 ${
                  isActive
                    ? 'bg-cyan-500 text-slate-950 border-cyan-400 font-bold shadow-md shadow-cyan-500/20'
                    : 'bg-slate-800/60 text-slate-300 hover:bg-slate-800 border-slate-700'
                }`}
              >
                <TabIcon className={`w-3.5 h-3.5 ${isActive ? 'text-slate-950' : tab.color}`} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Main Content Area */}
        <div className="p-6 overflow-y-auto space-y-6 custom-scrollbar">
          {/* Top 4D Mechanics Diagram Section */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Visual 4D Animated Simulation Box */}
            <div className="md:col-span-2 relative h-64 bg-slate-950 rounded-2xl border border-slate-800/80 overflow-hidden flex flex-col justify-between p-4">
              {/* Overlay Grid Line Effect */}
              <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px] opacity-40" />

              {/* Dynamic 4D Graphic per Sensor */}
              <div className="relative z-10 flex-1 flex items-center justify-center">
                {activeTab === 'optical' && (
                  <div className="relative w-full h-full flex flex-col items-center justify-center">
                    {/* Camera Beam Grid Projection */}
                    <div className="w-64 h-32 border-2 border-dashed border-sky-400/60 rounded-xl relative flex items-center justify-center animate-pulse bg-sky-950/20">
                      <div className="absolute -top-3 px-2 bg-slate-900 text-sky-400 font-mono text-[10px] border border-sky-500/40 rounded">
                        AI Bounding Box: Rolling Surface Shelling
                      </div>
                      <div className="text-center font-mono">
                        <div className="text-sky-300 font-bold text-sm">Crack Depth: 3.4 mm</div>
                        <div className="text-[10px] text-sky-400/80">Confidence: 99.4%</div>
                      </div>
                      {/* Scanning Laser Line */}
                      <div className="absolute inset-x-0 h-0.5 bg-cyan-400 shadow-[0_0_12px_#38bdf8] animate-bounce" />
                    </div>
                  </div>
                )}

                {activeTab === 'acoustic' && (
                  <div className="w-full h-full flex flex-col items-center justify-center gap-2">
                    {/* Acoustic Sound Wave Rings */}
                    <div className="relative w-48 h-32 flex items-center justify-center">
                      <div className="absolute inset-0 rounded-full border border-purple-500/40 animate-ping" />
                      <div className="absolute inset-4 rounded-full border border-purple-400/60 animate-pulse" />
                      <div className="text-center z-10 font-mono">
                        <div className="text-purple-300 font-bold text-base">
                          {telemetry.acousticDb} dB Peak Resonance
                        </div>
                        <div className="text-[10px] text-purple-400">Harmonic Doppler Shift: +14.2 Hz</div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'accelerometer' && (
                  <div className="w-full h-full flex items-center justify-center px-4">
                    {/* Live Tri-axial Oscilloscope Graph */}
                    <div className="w-full h-32 flex items-end gap-1.5 border-b border-emerald-500/40 pb-2">
                      {[0.2, 0.4, 0.8, 1.4, 2.2, 1.8, 0.9, 0.5, 0.3, 0.6, 1.2, 2.5, 1.1, 0.4].map((v, i) => (
                        <div
                          key={i}
                          className="flex-1 bg-gradient-to-t from-emerald-950 to-emerald-400 rounded-t transition-all duration-300"
                          style={{ height: `${Math.min(100, v * 35)}%` }}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {activeTab === 'laser' && (
                  <div className="w-full h-full flex flex-col items-center justify-center">
                    {/* Rail Gauge Cross Section Laser Line */}
                    <div className="w-72 h-28 relative border border-cyan-500/30 rounded-xl bg-cyan-950/20 p-3 flex flex-col justify-between">
                      <div className="flex justify-between font-mono text-[10px] text-cyan-300">
                        <span>Left Rail Head</span>
                        <span className="text-cyan-400 font-bold">Gauge: {1435 + telemetry.gaugeDevMm} mm</span>
                        <span>Right Rail Head</span>
                      </div>
                      {/* Laser Profile Arc */}
                      <svg className="w-full h-12 text-cyan-400" viewBox="0 0 100 30">
                        <path
                          d="M 5 25 L 20 25 L 25 10 L 35 10 L 40 25 L 60 25 L 65 10 L 75 10 L 80 25 L 95 25"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        />
                      </svg>
                    </div>
                  </div>
                )}
              </div>

              {/* Status Indicator Bar */}
              <div className="relative z-10 flex items-center justify-between border-t border-slate-800/80 pt-2 font-mono text-[11px] text-slate-400">
                <span className="flex items-center gap-1.5 text-emerald-400">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Sensor Status: ONLINE & SYNCED
                </span>
                <span>Latency: 1.2 ms</span>
              </div>
            </div>

            {/* Side Specification Telemetry Matrix */}
            <div className="bg-slate-950/60 rounded-2xl border border-slate-800 p-4 flex flex-col justify-between space-y-3">
              <div className="border-b border-slate-800 pb-2">
                <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400">
                  Primary Sensor Signal
                </span>
                <div className="text-2xl font-bold font-mono text-cyan-400 mt-1">
                  {currentConfig.primaryMetric}
                </div>
              </div>

              <div className="space-y-2 font-mono text-xs">
                <div className="flex justify-between py-1 border-b border-slate-800/60 text-slate-300">
                  <span className="text-slate-400">Accuracy / Resolution:</span>
                  <span className="font-semibold text-slate-100">{currentConfig.secondaryMetric}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800/60 text-slate-300">
                  <span className="text-slate-400">Sampling Speed:</span>
                  <span className="font-semibold text-slate-100">{currentConfig.samplingRate}</span>
                </div>
                <div className="flex justify-between py-1 text-slate-300">
                  <span className="text-slate-400">Carrier Signal:</span>
                  <span className="font-semibold text-slate-100">{currentConfig.wavelength}</span>
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-cyan-950/30 border border-cyan-500/20 text-[11px] font-mono text-cyan-300 flex items-center gap-2">
                <Cpu className="w-4 h-4 shrink-0" />
                Edge AI Hardware Accelerator Active (NVIDIA Orin 64GB)
              </div>
            </div>
          </div>

          {/* 4D Time Evolution Timeline Controls */}
          <div className="bg-slate-950/80 rounded-2xl border border-slate-800 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-mono text-xs font-bold text-slate-200">
                <Sparkles className="w-4 h-4 text-cyan-400" />
                4D Time-Lapse Evolution (60-Day Pass History)
              </div>
              <span className="text-xs font-mono font-bold text-cyan-400">
                Inspection Pass #{currentPassNumber} (Day {currentPassNumber * 12 - 11})
              </span>
            </div>

            {/* Pass Selector Buttons */}
            <div className="grid grid-cols-5 gap-2 font-mono text-xs">
              {[1, 2, 3, 4, 5].map((passNum) => {
                const isActive = currentPassNumber === passNum;
                return (
                  <button
                    key={passNum}
                    onClick={() => setPassNumber(passNum)}
                    className={`p-2.5 rounded-xl border transition-all text-center ${
                      isActive
                        ? 'bg-cyan-500 text-slate-950 font-bold border-cyan-400 shadow-md shadow-cyan-500/20'
                        : 'bg-slate-900 text-slate-300 border-slate-800 hover:bg-slate-800'
                    }`}
                  >
                    <div>Pass #{passNum}</div>
                    <div className={`text-[10px] ${isActive ? 'text-slate-950' : 'text-slate-400'}`}>
                      Day {passNum * 12 - 11}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-3 border-t border-slate-800 bg-slate-950/80 font-mono text-xs text-slate-400">
          <span>AAHAT AI Digital Twin Architecture v2.4</span>
          <button
            onClick={() => setSelectedSensor4D(null)}
            className="px-4 py-1.5 rounded-xl bg-cyan-500 text-slate-950 font-bold hover:bg-cyan-400 transition-colors"
          >
            Close 4D View
          </button>
        </div>
      </div>
    </div>
  );
}
