import React, { useState } from 'react';
import { useSimStore } from '../state/simStore';
import { Activity, Camera, Cpu, Sliders, ShieldCheck, X, ChevronRight, HelpCircle, Layers } from 'lucide-react';

export function OnboardingModal() {
  const showOnboarding = useSimStore((s) => s.showOnboarding);
  const setShowOnboarding = useSimStore((s) => s.setShowOnboarding);
  const [activeStep, setActiveStep] = useState(0);
  const [dontShowAgain, setDontShowAgain] = useState(false);

  if (!showOnboarding) return null;

  const handleClose = () => {
    if (dontShowAgain) {
      localStorage.setItem('aahat_hide_onboarding', 'true');
    }
    setShowOnboarding(false);
  };

  const steps = [
    {
      title: 'AAHAT Digital Twin Platform',
      icon: Cpu,
      color: 'text-cyan-400',
      badge: 'Overview',
      content: (
        <div className="space-y-3">
          <p className="text-slate-300 text-sm leading-relaxed">
            Welcome to <span className="text-cyan-400 font-semibold">AAHAT</span> — an AI-powered predictive railway safety digital twin. The simulator continuously monitors a 470m Catmull-Rom track spline using a sensor-equipped inspection cart.
          </p>
          <div className="grid grid-cols-2 gap-2 text-xs pt-1">
            <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
              <span className="text-cyan-400 font-semibold block mb-0.5">Edge AI Vision</span>
              <span className="text-slate-400">Automated surface crack & fastener defect detection.</span>
            </div>
            <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
              <span className="text-purple-400 font-semibold block mb-0.5">Acoustic & Vibration</span>
              <span className="text-slate-400">Ultrasonic sound spectrograms & G-force waveform analysis.</span>
            </div>
          </div>
        </div>
      ),
    },
    {
      title: '4D Timeline & Defect Forecast',
      icon: Activity,
      color: 'text-amber-400',
      badge: '4D Evolution',
      content: (
        <div className="space-y-3">
          <p className="text-slate-300 text-sm leading-relaxed">
            Track defects degrade over time across 5 inspection passes (<span className="text-amber-400 font-mono">Day 1 to Day 60</span>).
          </p>
          <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-800 space-y-2 text-xs">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
              <span className="text-slate-300 font-medium">Day 1–15:</span>
              <span className="text-slate-400">Normal / Minor surface wear</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
              <span className="text-slate-300 font-medium">Day 30:</span>
              <span className="text-slate-400">Warning severity — Micro-cracks develop</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse"></span>
              <span className="text-slate-300 font-medium">Day 45–60:</span>
              <span className="text-slate-400">Critical fracture risk + 3D Decal growth</span>
            </div>
          </div>
          <p className="text-slate-400 text-xs italic">
            Enable <span className="text-cyan-300 font-medium">Predictive Forecast</span> to view linear degradation slope lines & 3D ghosted forecast rings!
          </p>
        </div>
      ),
    },
    {
      title: 'Multimodal Sensor Fusion Engine',
      icon: Layers,
      color: 'text-purple-400',
      badge: 'Sensor Fusion',
      content: (
        <div className="space-y-3">
          <p className="text-slate-300 text-sm leading-relaxed">
            The <span className="text-purple-400 font-semibold">Sensor Fusion Engine</span> cross-checks Vision, Acoustic, and Vibration signals in real time.
          </p>
          <div className="p-3 bg-purple-950/40 border border-purple-800/50 rounded-lg text-xs space-y-1.5">
            <div className="flex justify-between font-mono text-purple-300">
              <span>MULTI-SENSOR CONSENSUS</span>
              <span className="text-emerald-400">+12% BONUS</span>
            </div>
            <p className="text-slate-300 text-xs">
              When 2 or 3 sensors detect anomalies at the same track kilometer, confidence is boosted and marked with a glowing <span className="text-emerald-400 font-semibold">MULTI-SENSOR CONFIRMED</span> halo.
            </p>
          </div>
        </div>
      ),
    },
    {
      title: 'Camera Views & Interactive Controls',
      icon: Camera,
      color: 'text-emerald-400',
      badge: 'Interactions',
      content: (
        <div className="space-y-3">
          <p className="text-slate-300 text-sm leading-relaxed">
            Explore the track using multiple camera modes or click any 3D beacon/2D GIS map pin to inspect multi-sensor evidence.
          </p>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800">
              <span className="text-cyan-400 font-medium block">Camera Modes</span>
              <span className="text-slate-400">Chase Cam, Sensor POV, Top GIS Map, Free Orbit, Cinematic Fly-through.</span>
            </div>
            <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800">
              <span className="text-emerald-400 font-medium block">Maintenance Workflow</span>
              <span className="text-slate-400">Confirm, reject, or schedule repairs via the 7-stage state machine.</span>
            </div>
          </div>
        </div>
      ),
    },
  ];

  const CurrentIcon = steps[activeStep].icon;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-xl bg-slate-900/95 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-cyan-950/80 border border-cyan-800/60">
              <CurrentIcon className={`w-5 h-5 ${steps[activeStep].color}`} />
            </div>
            <div>
              <span className="text-[10px] font-mono tracking-wider uppercase px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-400 border border-cyan-800">
                {steps[activeStep].badge} ({activeStep + 1}/{steps.length})
              </span>
              <h2 className="text-base font-bold text-slate-100 tracking-wide mt-0.5">
                {steps[activeStep].title}
              </h2>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            title="Dismiss onboarding"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1">
          {steps[activeStep].content}
        </div>

        {/* Footer Navigation */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between">
          <label className="flex items-center gap-2 text-xs text-slate-400 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={dontShowAgain}
              onChange={(e) => setDontShowAgain(e.target.checked)}
              className="rounded bg-slate-950 border-slate-700 text-cyan-500 focus:ring-cyan-500/30"
            />
            <span>Do not show again</span>
          </label>

          <div className="flex items-center gap-2">
            {activeStep > 0 && (
              <button
                onClick={() => setActiveStep((prev) => prev - 1)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 transition"
              >
                Back
              </button>
            )}

            {activeStep < steps.length - 1 ? (
              <button
                onClick={() => setActiveStep((prev) => prev + 1)}
                className="px-4 py-1.5 rounded-lg text-xs font-semibold text-slate-950 bg-cyan-400 hover:bg-cyan-300 transition flex items-center gap-1 shadow-lg shadow-cyan-500/20"
              >
                <span>Next</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                onClick={handleClose}
                className="px-5 py-1.5 rounded-lg text-xs font-bold text-slate-950 bg-emerald-400 hover:bg-emerald-300 transition flex items-center gap-1 shadow-lg shadow-emerald-500/20"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Launch Simulator</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
