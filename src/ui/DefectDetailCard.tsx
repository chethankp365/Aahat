import React from 'react';
import { useSimStore } from '../state/simStore';
import { computePredictiveForecast, getDefectStateAtPass, DefectStatus } from '../sim/defectEngine';
import { fuseMultimodalSignals } from '../sim/riskEngine';
import { generateVibrationWaveform, generateAcousticSpectrum } from '../sim/sensorSignals';
import {
  X,
  AlertTriangle,
  ShieldCheck,
  Wrench,
  Activity,
  Zap,
  TrendingUp,
  Camera,
  Target,
  CheckCircle2,
  XCircle,
  Clock,
  RefreshCw,
  Award,
  Sparkles
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip, ReferenceLine, AreaChart, Area, BarChart, Bar } from 'recharts';

export function DefectDetailCard() {
  const selectedDefectId = useSimStore((s) => s.selectedDefectId);
  const rawDefects = useSimStore((s) => s.rawDefects);
  const currentPassNumber = useSimStore((s) => s.currentPassNumber);
  const vehicleSpeed = useSimStore((s) => s.vehicleSpeedKmH);
  const selectDefect = useSimStore((s) => s.selectDefect);
  const updateDefectStatus = useSimStore((s) => s.updateDefectStatus);

  const rawDefect = rawDefects.find((d) => d.id === selectedDefectId);

  if (!rawDefect) return null;

  const defectState = getDefectStateAtPass(rawDefect, currentPassNumber);
  const forecast = computePredictiveForecast(rawDefect, currentPassNumber);

  // Compute Multimodal Fusion Result
  const fusion = fuseMultimodalSignals(94.8, defectState.acousticDb, defectState.vibrationG);

  // Generate evidence snippets at this moment
  const vibSnippet = generateVibrationWaveform(defectState.vibrationG, vehicleSpeed).slice(0, 15);
  const acousticSnippet = generateAcousticSpectrum(defectState.acousticDb).slice(0, 8);

  const isCritical = fusion.riskCategory === 'Critical';
  const isWarning = fusion.riskCategory === 'Warning';

  // Combine historical & forecast points for chart display
  const chartData = [
    ...forecast.historicalPoints.map(p => ({ day: p.day, risk: p.riskScore, type: 'Historical' })),
    ...forecast.forecastPoints.map(p => ({ day: p.day, projectedRisk: p.projectedRisk, type: 'Forecast' }))
  ];

  // Helper formatting for maintenance status state machine badge
  const getStatusBadge = (status: DefectStatus) => {
    switch (status) {
      case 'confirmed':
        return { label: 'CONFIRMED', color: 'bg-rose-950 text-rose-300 border-rose-500/60' };
      case 'scheduled':
        return { label: 'MAINTENANCE SCHEDULED', color: 'bg-amber-950 text-amber-300 border-amber-500/60' };
      case 'repaired':
        return { label: 'REPAIR COMPLETED', color: 'bg-indigo-950 text-indigo-300 border-indigo-500/60' };
      case 'ai_reinspected':
        return { label: 'AI RE-INSPECTED', color: 'bg-purple-950 text-purple-300 border-purple-500/60' };
      case 'resolved':
        return { label: 'RESOLVED / REJECTED', color: 'bg-emerald-950 text-emerald-300 border-emerald-500/60' };
      case 'under_verification':
        return { label: 'UNDER VERIFICATION', color: 'bg-blue-950 text-blue-300 border-blue-500/60' };
      default:
        return { label: 'DETECTED', color: 'bg-cyan-950 text-cyan-300 border-cyan-500/60' };
    }
  };

  const statusBadge = getStatusBadge(rawDefect.status);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-md animate-fade-in select-none">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden text-slate-100 font-sans flex flex-col max-h-[90vh]">
        {/* Header Bar */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-950/80">
          <div className="flex items-center gap-3">
            <div
              className={`p-2.5 rounded-xl border ${
                isCritical
                  ? 'bg-rose-950 text-rose-400 border-rose-500/50 shadow-lg shadow-rose-950/50'
                  : isWarning
                  ? 'bg-amber-950 text-amber-400 border-amber-500/50'
                  : 'bg-cyan-950 text-cyan-400 border-cyan-500/50'
              }`}
            >
              <AlertTriangle className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-cyan-400">{defectState.id}</span>
                <span className="text-xs font-mono text-slate-400">
                  KM {defectState.locationKm.toFixed(3)} ({(12.9716 + defectState.locationKm * 0.05).toFixed(4)}° N, {(77.5946 + defectState.locationKm * 0.08).toFixed(4)}° E)
                </span>
              </div>
              <h2 className="text-lg font-bold text-white">{defectState.title}</h2>
            </div>
          </div>

          <button
            onClick={() => selectDefect(null)}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5 overflow-y-auto custom-scrollbar flex-1">
          {/* MAINTENANCE STATE MACHINE BADGE BANNER */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono">
            <span className="text-slate-400">Maintenance State Machine:</span>
            <span className={`px-3 py-1 rounded-lg font-bold border ${statusBadge.color}`}>
              {statusBadge.label}
            </span>
          </div>

          {/* PROGRAMMATICALLY GENERATED PLAIN-LANGUAGE EXPLANATION SENTENCE */}
          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-cyan-400">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <span>AI Multimodal Diagnostic Explanation</span>
            </div>
            <p className="text-xs font-sans text-slate-200 leading-relaxed">
              {fusion.explanationSentence}
            </p>
          </div>

          {/* FUSED CONFIDENCE & RISK METRICS */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800">
              <div className="text-xs font-mono text-slate-400 mb-1">Fused AI Confidence Score</div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold font-mono text-cyan-400">{fusion.fusedConfidence}%</span>
              </div>
              <div className="w-full h-1.5 mt-2 bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-cyan-400" style={{ width: `${fusion.fusedConfidence}%` }} />
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800">
              <div className="text-xs font-mono text-slate-400 mb-1">Risk Category & Pass</div>
              <div className="text-base font-bold capitalize text-amber-300">
                {fusion.riskCategory} &bull; Pass #{currentPassNumber}
              </div>
              <div className="text-xs font-mono text-slate-400 mt-1">
                Crack Size: <span className="text-cyan-300 font-bold">{defectState.crackLengthMm} mm</span>
              </div>
            </div>
          </div>

          {/* THREE PIECES OF EVIDENCE (VISION SNAPSHOT, ACOUSTIC SPECTROGRAM, VIBRATION WAVEFORM) */}
          <div>
            <h3 className="text-xs font-mono uppercase tracking-wider text-slate-400 mb-2.5">Synchronized Evidence Snippets</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* 1. Vision Snapshot */}
              <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-col">
                <div className="flex items-center gap-1.5 text-xs font-mono text-cyan-300 mb-2">
                  <Camera className="w-3.5 h-3.5 text-cyan-400" /> Optical Vision
                </div>
                <div className="relative h-28 w-full rounded bg-slate-900 border border-slate-800 flex items-center justify-center overflow-hidden">
                  <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:15px_15px] opacity-30" />
                  <div className="p-2 rounded border-2 border-dashed border-rose-500 bg-rose-950/70 text-center animate-pulse">
                    <div className="text-[9px] font-mono font-bold text-rose-200 uppercase">{defectState.type}</div>
                    <div className="text-[9px] font-mono text-cyan-300 font-bold mt-0.5">94.8% Conf</div>
                  </div>
                </div>
              </div>

              {/* 2. Acoustic Spectrogram Snippet */}
              <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-col">
                <div className="flex items-center gap-1.5 text-xs font-mono text-purple-300 mb-2">
                  <Zap className="w-3.5 h-3.5 text-purple-400" /> Acoustic FFT
                </div>
                <div className="h-28 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={acousticSnippet}>
                      <Bar dataKey="amplitudeDb" fill="#a855f7" radius={[2, 2, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* 3. Vibration Waveform Snippet */}
              <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-col">
                <div className="flex items-center gap-1.5 text-xs font-mono text-emerald-300 mb-2">
                  <Activity className="w-3.5 h-3.5 text-emerald-400" /> Vibration G
                </div>
                <div className="h-28 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={vibSnippet}>
                      <Area type="monotone" dataKey="accelG" stroke="#10b981" fill="#10b981" fillOpacity={0.3} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>

          {/* HISTORICAL TREND MINI-CHART & PREDICTIVE FORECAST */}
          <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-xs font-mono">
              <div className="flex items-center gap-1.5 text-rose-400 font-bold">
                <TrendingUp className="w-4 h-4" />
                <span>HISTORICAL PASS TREND & PREDICTIVE FORECAST</span>
              </div>
              <div className="text-slate-400 text-[11px]">
                Trend Slope: <strong className="text-cyan-300">+{forecast.trendSlope} pts/day</strong>
              </div>
            </div>

            <div className="w-full h-32 pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                  <XAxis dataKey="day" tick={{ fill: '#64748b', fontSize: 10 }} label={{ value: 'Day', position: 'insideBottom', fill: '#64748b', offset: -5 }} />
                  <YAxis domain={[0, 100]} tick={{ fill: '#64748b', fontSize: 10 }} />
                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#0284c7', borderRadius: '8px', fontSize: '11px' }} />
                  <ReferenceLine y={85} stroke="#ef4444" strokeDasharray="3 3" />
                  <Line type="monotone" dataKey="risk" stroke="#06b6d4" strokeWidth={2} dot={{ r: 4 }} name="Historical Risk" />
                  <Line type="monotone" dataKey="projectedRisk" stroke="#f43f5e" strokeWidth={2} strokeDasharray="5 5" dot={false} name="Projected Forecast" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* MAINTENANCE WORKFLOW ACTION BUTTONS */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/90 flex flex-wrap items-center justify-between gap-3">
          <button
            onClick={() => selectDefect(null)}
            className="px-4 py-2 text-xs font-mono rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
          >
            Close Inspector
          </button>

          <div className="flex items-center gap-2">
            {/* Reject / False Positive Button */}
            <button
              onClick={() => {
                updateDefectStatus(rawDefect.id, 'resolved');
                selectDefect(null);
              }}
              className="px-3 py-2 text-xs font-mono rounded-xl bg-slate-800 hover:bg-rose-950 text-slate-300 hover:text-rose-300 border border-slate-700 flex items-center gap-1.5 transition-colors"
            >
              <XCircle className="w-4 h-4 text-rose-400" />
              Reject (False Positive)
            </button>

            {/* Confirm Defect Button */}
            <button
              onClick={() => {
                updateDefectStatus(rawDefect.id, 'confirmed');
              }}
              className="px-3 py-2 text-xs font-mono rounded-xl bg-cyan-950 hover:bg-cyan-900 text-cyan-300 border border-cyan-500/50 flex items-center gap-1.5 transition-colors"
            >
              <CheckCircle2 className="w-4 h-4 text-cyan-400" />
              Confirm Defect
            </button>

            {/* Schedule Maintenance Button */}
            <button
              onClick={() => {
                updateDefectStatus(rawDefect.id, 'scheduled');
              }}
              className="px-4 py-2 text-xs font-mono font-bold rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 flex items-center gap-1.5 transition-all shadow-lg shadow-cyan-500/20"
            >
              <Wrench className="w-4 h-4" />
              Schedule Maintenance
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
