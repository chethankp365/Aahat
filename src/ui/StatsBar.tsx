import React from 'react';
import { useSimStore } from '../state/simStore';
import { INSPECTION_PASSES } from '../sim/defectEngine';
import { Activity, Gauge, Radio, Calendar, Play, Pause, FastForward, Sparkles, HelpCircle } from 'lucide-react';

export function StatsBar() {
  const vehicleProgress = useSimStore((s) => s.vehicleProgress);
  const vehicleSpeed = useSimStore((s) => s.vehicleSpeedKmH);
  const isPlaying = useSimStore((s) => s.isPlaying);
  const togglePlay = useSimStore((s) => s.togglePlay);
  const timeMultiplier = useSimStore((s) => s.timeMultiplier);
  const setTimeMultiplier = useSimStore((s) => s.setTimeMultiplier);
  const currentPassNumber = useSimStore((s) => s.currentPassNumber);
  const trackLength = useSimStore((s) => s.trackLength);
  const enablePostProcessing = useSimStore((s) => s.enablePostProcessing);
  const togglePostProcessing = useSimStore((s) => s.togglePostProcessing);
  const setShowOnboarding = useSimStore((s) => s.setShowOnboarding);

  const currentKm = ((vehicleProgress * trackLength) / 1000).toFixed(3);
  const passInfo = INSPECTION_PASSES.find((p) => p.passNumber === currentPassNumber) || INSPECTION_PASSES[0];

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 px-4 sm:px-6 py-2.5 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 text-slate-100 shadow-2xl z-30 select-none font-mono">
      {/* Brand Title & System Badge */}
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 shadow-lg shadow-cyan-500/30">
          <Activity className="w-5 h-5 text-white animate-pulse" />
        </div>
        <div>
          <h1 className="text-sm sm:text-base font-bold tracking-wide text-white flex items-center gap-2">
            AAHAT <span className="text-cyan-400 font-extrabold hidden sm:inline">&mdash; Live Track Monitoring</span>
          </h1>
          <p className="text-[10px] sm:text-xs text-slate-400">AI Predictive Railway Digital Twin Engine</p>
        </div>
      </div>

      {/* Center Simulated Date / Pass & Playback Controls */}
      <div className="flex flex-wrap items-center gap-2 sm:gap-3 bg-slate-950/80 px-3 py-1 rounded-xl border border-slate-800">
        {/* Date / Pass Indicator */}
        <div className="flex items-center gap-1.5 text-cyan-300 text-xs">
          <Calendar className="w-3.5 h-3.5 text-cyan-400" />
          <span className="font-bold">{passInfo.dateLabel}</span>
        </div>

        <div className="h-4 w-px bg-slate-800 hidden sm:block" />

        {/* Play / Pause Toggle */}
        <button
          onClick={togglePlay}
          className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1 transition-all ${
            isPlaying ? 'bg-amber-500 text-slate-950 hover:bg-amber-400' : 'bg-emerald-500 text-slate-950 hover:bg-emerald-400'
          }`}
        >
          {isPlaying ? <Pause className="w-3 h-3 fill-current" /> : <Play className="w-3 h-3 fill-current" />}
          <span>{isPlaying ? 'PAUSE' : 'PLAY'}</span>
        </button>

        {/* Speed Multiplier Selectors */}
        <div className="flex items-center gap-1 text-[11px]">
          <FastForward className="w-3 h-3 text-slate-400 hidden sm:inline" />
          {[0.5, 1, 4, 20].map((mult) => (
            <button
              key={mult}
              onClick={() => setTimeMultiplier(mult)}
              className={`px-1.5 py-0.5 rounded font-bold transition-all ${
                timeMultiplier === mult
                  ? 'bg-cyan-500 text-slate-950 shadow-sm'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200'
              }`}
            >
              {mult}x
            </button>
          ))}
        </div>
      </div>

      {/* Right Controls: Location, Post-Processing & Onboarding Help */}
      <div className="flex items-center gap-2 sm:gap-3 text-xs">
        <div className="hidden md:flex items-center gap-2 px-2.5 py-1 rounded-lg bg-slate-950/60 border border-slate-800">
          <Gauge className="w-3.5 h-3.5 text-cyan-400" />
          <div>
            <div className="text-[9px] uppercase tracking-wider text-slate-400">Speed</div>
            <div className="font-bold text-white text-xs">{vehicleSpeed.toFixed(0)} <span className="text-[9px] font-normal text-slate-400">km/h</span></div>
          </div>
        </div>

        <div className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-slate-950/60 border border-slate-800">
          <Radio className="w-3.5 h-3.5 text-emerald-400" />
          <div>
            <div className="text-[9px] uppercase tracking-wider text-slate-400">Position</div>
            <div className="font-bold text-emerald-300 text-xs">KM {currentKm}</div>
          </div>
        </div>

        {/* Post-Processing Toggle Button */}
        <button
          onClick={togglePostProcessing}
          className={`p-2 rounded-lg border transition-all flex items-center gap-1 text-xs font-semibold ${
            enablePostProcessing
              ? 'bg-purple-950/80 border-purple-700 text-purple-300 shadow-sm shadow-purple-900/50'
              : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200'
          }`}
          title={enablePostProcessing ? 'Disable Post-Processing (Bloom/ACES)' : 'Enable Post-Processing (Bloom/ACES)'}
        >
          <Sparkles className={`w-3.5 h-3.5 ${enablePostProcessing ? 'text-purple-400 animate-pulse' : 'text-slate-500'}`} />
          <span className="hidden xl:inline">{enablePostProcessing ? 'FX ON' : 'FX OFF'}</span>
        </button>

        {/* Onboarding Guide Trigger */}
        <button
          onClick={() => setShowOnboarding(true)}
          className="p-2 rounded-lg bg-slate-950/60 border border-slate-800 hover:border-slate-700 text-cyan-400 hover:text-cyan-300 transition-all flex items-center gap-1 text-xs font-semibold"
          title="How to use simulator onboarding guide"
        >
          <HelpCircle className="w-3.5 h-3.5 text-cyan-400" />
          <span className="hidden xl:inline">Guide</span>
        </button>
      </div>
    </div>
  );
}
