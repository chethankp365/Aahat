import React from 'react';
import { useSimStore } from '../state/simStore';
import { INSPECTION_PASSES } from '../sim/defectEngine';
import { Play, Pause, SkipBack, SkipForward, FastForward, Calendar, TrendingUp, RotateCcw } from 'lucide-react';

export function Timeline() {
  const isPlaying = useSimStore((s) => s.isPlaying);
  const togglePlay = useSimStore((s) => s.togglePlay);
  const vehicleProgress = useSimStore((s) => s.vehicleProgress);
  const setVehicleProgress = useSimStore((s) => s.setVehicleProgress);
  const timeMultiplier = useSimStore((s) => s.timeMultiplier);
  const setTimeMultiplier = useSimStore((s) => s.setTimeMultiplier);
  const currentPassNumber = useSimStore((s) => s.currentPassNumber);
  const setPassNumber = useSimStore((s) => s.setPassNumber);
  const showPredictiveForecast = useSimStore((s) => s.showPredictiveForecast);
  const togglePredictiveForecast = useSimStore((s) => s.togglePredictiveForecast);
  const trackLength = useSimStore((s) => s.trackLength);
  const getActiveDefects = useSimStore((s) => s.getActiveDefects);
  const selectDefect = useSimStore((s) => s.selectDefect);

  const activeDefects = getActiveDefects();
  const currentDistanceM = vehicleProgress * trackLength;

  return (
    <div className="flex flex-col gap-3 p-4 bg-slate-900/90 backdrop-blur-lg border border-slate-800 rounded-2xl shadow-2xl text-slate-100 font-mono select-none">
      {/* Top 4D Inspection Pass Time Selector & Predictive Forecast Toggle */}
      <div className="flex items-center justify-between gap-3 pb-2 border-b border-slate-800 text-xs">
        <div className="flex items-center gap-1.5 text-cyan-400">
          <Calendar className="w-4 h-4" />
          <span className="font-bold">INSPECTION PASS TIMELINE (4D):</span>
        </div>

        {/* Pass Selector Tabs (Day 1 to Day 60) */}
        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
          {INSPECTION_PASSES.map((pass) => {
            const isActive = currentPassNumber === pass.passNumber;

            return (
              <button
                key={pass.passNumber}
                onClick={() => setPassNumber(pass.passNumber)}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                  isActive
                    ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/30'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Day {pass.dayNumber}
              </button>
            );
          })}
        </div>

        {/* Predictive Forecast Toggle Button */}
        <button
          onClick={togglePredictiveForecast}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-xl border transition-all text-xs font-bold ${
            showPredictiveForecast
              ? 'bg-rose-950 text-rose-300 border-rose-500/60 shadow-lg shadow-rose-950/40'
              : 'bg-slate-950/60 text-slate-400 border-slate-800 hover:text-slate-200'
          }`}
          title="Toggle 3D Predictive Trend Forecast"
        >
          <TrendingUp className="w-3.5 h-3.5" />
          <span>Forecast Mode</span>
        </button>
      </div>

      {/* Track Progress Scrub Bar */}
      <div className="relative w-full">
        {/* Progress Bar background */}
        <div className="relative h-2.5 w-full bg-slate-950 rounded-full overflow-hidden border border-slate-800">
          <div
            className="h-full bg-gradient-to-r from-cyan-500 via-blue-500 to-emerald-400 transition-all duration-75"
            style={{ width: `${vehicleProgress * 100}%` }}
          />
        </div>

        {/* Clickable scrub input slider */}
        <input
          type="range"
          min={0}
          max={1}
          step={0.001}
          value={vehicleProgress}
          onChange={(e) => setVehicleProgress(parseFloat(e.target.value))}
          className="absolute inset-0 w-full opacity-0 cursor-pointer h-4"
        />

        {/* Defect Markers on Scrub Timeline evaluated at active Pass */}
        <div className="relative w-full h-3 mt-1">
          {activeDefects.map((defect) => {
            const pct = (defect.distance / trackLength) * 100;
            const colorHex =
              defect.severity === 'critical'
                ? '#ef4444'
                : defect.severity === 'high'
                ? '#f97316'
                : defect.severity === 'medium'
                ? '#eab308'
                : defect.severity === 'low'
                ? '#06b6d4'
                : '#10b981';

            return (
              <button
                key={defect.id}
                onClick={() => selectDefect(defect.id)}
                title={`${defect.id}: ${defect.title} (${defect.severity}) - ${defect.locationKm.toFixed(3)} km`}
                className="absolute top-0 -translate-x-1/2 w-2.5 h-2.5 rounded-full transform hover:scale-150 transition-transform cursor-pointer border border-slate-950"
                style={{ left: `${pct}%`, backgroundColor: colorHex }}
              />
            );
          })}
        </div>
      </div>

      {/* Control Buttons & Time-Lapse Multiplier Selector */}
      <div className="flex items-center justify-between gap-4 mt-1">
        {/* Current Track Distance */}
        <div className="text-xs text-slate-400">
          Pos: <span className="font-bold text-cyan-300">{currentDistanceM.toFixed(1)}m</span> / {trackLength.toFixed(0)}m
        </div>

        {/* Playback Buttons */}
        <div className="flex items-center gap-2">
          {/* Reset Position to Start */}
          <button
            onClick={() => setVehicleProgress(0)}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            title="Reset Vehicle to Track Start"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          {/* Step Back 20m */}
          <button
            onClick={() => setVehicleProgress(Math.max(0, vehicleProgress - 20 / trackLength))}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            title="Step Back 20m"
          >
            <SkipBack className="w-4 h-4" />
          </button>

          {/* Play / Pause Toggle */}
          <button
            onClick={togglePlay}
            className={`p-3 rounded-xl shadow-lg transition-all transform active:scale-95 ${
              isPlaying
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30'
                : 'bg-emerald-500 text-slate-950 font-bold hover:bg-emerald-400 shadow-emerald-500/30'
            }`}
          >
            {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 fill-current" />}
          </button>

          {/* Step Forward 20m */}
          <button
            onClick={() => setVehicleProgress(Math.min(1, vehicleProgress + 20 / trackLength))}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            title="Step Forward 20m"
          >
            <SkipForward className="w-4 h-4" />
          </button>
        </div>

        {/* Speed & Time-Lapse Multipliers (0.5x, 1x, 4x, 20x) */}
        <div className="flex items-center gap-1.5 text-xs">
          <FastForward className="w-3.5 h-3.5 text-slate-400 mr-1" />
          {[0.5, 1, 4, 20].map((speed) => (
            <button
              key={speed}
              onClick={() => setTimeMultiplier(speed)}
              className={`px-2 py-1 rounded-md text-xs font-semibold transition-all ${
                timeMultiplier === speed
                  ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/30 font-bold'
                  : 'bg-slate-950/60 text-slate-400 border border-slate-800 hover:text-slate-200'
              }`}
            >
              {speed === 20 ? '20x (Time-Lapse)' : `${speed}x`}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
