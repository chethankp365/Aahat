import React, { useState, useEffect } from 'react';
import { Scene } from '../scene/Scene';
import { StatsBar } from './StatsBar';
import { LiveMonitoringPanel } from './LiveMonitoringPanel';
import { AlertPanel } from './AlertPanel';
import { MapPanel } from './MapPanel';
import { EvidencePanel } from './EvidencePanel';
import { SegmentHealthMap } from './SegmentHealthMap';
import { AnalyticsStrip } from './AnalyticsStrip';
import { Timeline } from './Timeline';
import { DefectDetailCard } from './DefectDetailCard';
import { CriticalToastAlert } from './CriticalToastAlert';
import { OnboardingModal } from './OnboardingModal';
import { RiskLegend } from './RiskLegend';
import { useSimStore } from '../state/simStore';
import { useTimeController } from '../sim/timeController';
import { useControls, Leva } from 'leva';
import {
  Video,
  Camera,
  Map,
  Eye,
  Sliders,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Zap,
  Activity,
} from 'lucide-react';

export function Dashboard() {
  // Drive simulation tick loop
  useTimeController();

  const cameraMode = useSimStore((s) => s.cameraMode);
  const setCameraMode = useSimStore((s) => s.setCameraMode);
  const activeSensors = useSimStore((s) => s.activeSensors);
  const toggleSensor = useSimStore((s) => s.toggleSensor);
  const setShowOnboarding = useSimStore((s) => s.setShowOnboarding);
  const [showLevaPanel, setShowLevaPanel] = useState(false);

  // Panel Collapsible drawer states (auto-collapse on small screens)
  const [isLeftOpen, setIsLeftOpen] = useState(true);
  const [isRightOpen, setIsRightOpen] = useState(true);

  // Check initial window width for responsive auto-collapse
  useEffect(() => {
    if (window.innerWidth < 1024) {
      setIsLeftOpen(false);
      setIsRightOpen(false);
    }

    // Check if onboarding was previously dismissed
    const hideOnboarding = localStorage.getItem('aahat_hide_onboarding');
    if (hideOnboarding === 'true') {
      setShowOnboarding(false);
    }
  }, [setShowOnboarding]);

  // Optional Leva dev debug controls configuration
  useControls('Digital Twin Debug Panel', {
    'Vehicle Speed (km/h)': {
      value: useSimStore.getState().vehicleSpeedKmH,
      min: 0,
      max: 120,
      step: 1,
      onChange: (v) => useSimStore.getState().setVehicleSpeed(v),
    },
    'Show Sensor Beams': {
      value: useSimStore.getState().showSensorBeams,
      onChange: () => useSimStore.getState().toggleDebugOption('showSensorBeams'),
    },
    'Wireframe Mode': {
      value: useSimStore.getState().showWireframe,
      onChange: () => useSimStore.getState().toggleDebugOption('showWireframe'),
    },
  });

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-slate-950 font-sans select-none">
      {/* 1. 3D WebGL Canvas Background Scene */}
      <Scene />

      {/* 2. Onboarding Modal Walkthrough */}
      <OnboardingModal />

      {/* 3. On-Canvas Risk Color Coding Legend */}
      <RiskLegend />

      {/* Leva Debug Controls Panel (Toggled by user) */}
      <div className={showLevaPanel ? 'block relative z-50' : 'hidden'}>
        <Leva titleBar={{ title: 'Leva Dev Controls' }} collapsed={false} />
      </div>

      {/* 4. Animated Critical Toast Alert Banner */}
      <CriticalToastAlert />

      {/* 5. Top Industrial HUD Bar */}
      <StatsBar />

      {/* 6. Quick Camera Mode & Sensor Switcher Bar */}
      <div className="absolute top-14 sm:top-16 left-3 sm:left-6 z-20 flex flex-wrap items-center gap-2 sm:gap-3 p-1.5 sm:p-2 bg-slate-900/85 backdrop-blur-md border border-slate-800 rounded-2xl shadow-2xl max-w-[calc(100vw-24px)] overflow-x-auto">
        {/* Camera View Mode Selector */}
        <div className="flex items-center gap-1 font-mono text-xs shrink-0">
          {(
            [
              { id: 'chase', label: 'Chase Cam', icon: Video },
              { id: 'orbit', label: 'Free Orbit', icon: Eye },
              { id: 'sensor', label: 'Sensor View', icon: Camera },
              { id: 'top', label: 'Top Map', icon: Map },
              { id: 'cinematic', label: 'Cinematic', icon: Sparkles },
            ] as const
          ).map((mode) => {
            const Icon = mode.icon;
            const isActive = cameraMode === mode.id;

            return (
              <button
                key={mode.id}
                onClick={() => setCameraMode(mode.id)}
                className={`flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl font-semibold transition-all text-xs ${
                  isActive
                    ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/30 font-bold'
                    : 'bg-slate-950/60 text-slate-300 hover:text-white border border-slate-800 hover:bg-slate-800'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{mode.label}</span>
              </button>
            );
          })}
        </div>

        <div className="w-px h-5 bg-slate-800 hidden md:block shrink-0" />

        {/* Sensor Toggles */}
        <div className="hidden md:flex items-center gap-1.5 shrink-0">
          <button
            onClick={() => toggleSensor('optical')}
            className={`px-2 py-1 text-xs font-mono rounded-xl border transition-all flex items-center gap-1 ${
              activeSensors.optical
                ? 'bg-cyan-950 text-cyan-300 border-cyan-500/50'
                : 'bg-slate-950/60 text-slate-500 border-slate-800 opacity-60'
            }`}
          >
            <Camera className="w-3 h-3" /> Optical
          </button>
          <button
            onClick={() => toggleSensor('acoustic')}
            className={`px-2 py-1 text-xs font-mono rounded-xl border transition-all flex items-center gap-1 ${
              activeSensors.acoustic
                ? 'bg-purple-950 text-purple-300 border-purple-500/50'
                : 'bg-slate-950/60 text-slate-500 border-slate-800 opacity-60'
            }`}
          >
            <Zap className="w-3 h-3" /> Acoustic
          </button>
          <button
            onClick={() => toggleSensor('accelerometer')}
            className={`px-2 py-1 text-xs font-mono rounded-xl border transition-all flex items-center gap-1 ${
              activeSensors.accelerometer
                ? 'bg-emerald-950 text-emerald-300 border-emerald-500/50'
                : 'bg-slate-950/60 text-slate-500 border-slate-800 opacity-60'
            }`}
          >
            <Activity className="w-3 h-3" /> Accel
          </button>
        </div>

        <div className="w-px h-5 bg-slate-800 hidden xl:block shrink-0" />

        <button
          onClick={() => setShowLevaPanel(!showLevaPanel)}
          className="hidden xl:flex p-1.5 rounded-xl bg-slate-950/60 text-slate-400 border border-slate-800 hover:text-white font-mono text-xs items-center gap-1 shrink-0"
        >
          <Sliders className="w-3.5 h-3.5" /> Dev Leva
        </button>
      </div>

      {/* 7. Left Column: Live Monitoring Telemetry Panel */}
      <div
        className={`absolute top-28 sm:top-36 left-3 sm:left-6 z-20 w-72 transition-all duration-300 ${
          isLeftOpen ? 'translate-x-0 opacity-100' : '-translate-x-[300px] opacity-0 pointer-events-none'
        }`}
      >
        <LiveMonitoringPanel />
      </div>

      <button
        onClick={() => setIsLeftOpen(!isLeftOpen)}
        className="absolute top-28 sm:top-36 left-1 sm:left-2 z-20 p-1.5 rounded-xl bg-slate-900/90 border border-slate-800 text-slate-300 hover:text-white shadow-xl"
        title="Toggle Telemetry Panel"
      >
        {isLeftOpen ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
      </button>

      {/* 8. Right Column: AI Detection Feed & Mini Map & Evidence */}
      <div
        className={`absolute top-28 sm:top-36 right-3 sm:right-6 z-20 w-80 sm:w-[400px] max-h-[calc(100vh-250px)] flex flex-col gap-2.5 transition-all duration-300 ${
          isRightOpen ? 'translate-x-0 opacity-100' : 'translate-x-[440px] opacity-0 pointer-events-none'
        }`}
      >
        <div className="h-36 sm:h-40">
          <MapPanel />
        </div>
        <div className="h-44 sm:h-48">
          <AlertPanel />
        </div>
        <div className="flex-1 min-h-[180px] sm:min-h-[210px]">
          <EvidencePanel />
        </div>
      </div>

      <button
        onClick={() => setIsRightOpen(!isRightOpen)}
        className="absolute top-28 sm:top-36 right-1 sm:right-2 z-20 p-1.5 rounded-xl bg-slate-900/90 border border-slate-800 text-slate-300 hover:text-white shadow-xl"
        title="Toggle AI Detection Feed"
      >
        {isRightOpen ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
      </button>

      {/* 9. Bottom Dock Container: Segmented Health Map + Analytics Strip + Timeline */}
      <div className="absolute bottom-2 sm:bottom-4 left-1/2 -translate-x-1/2 z-20 w-full max-w-4xl px-2 sm:px-4 flex flex-col gap-2">
        {/* Segmented Digital Track Health Ribbon */}
        <SegmentHealthMap />

        {/* Analytics Counter Strip & Overall Health Gauge */}
        <AnalyticsStrip />

        {/* 4D Timeline Playback Controls */}
        <Timeline />
      </div>

      {/* 10. Slide-In Modal Inspector Card */}
      <DefectDetailCard />
    </div>
  );
}
