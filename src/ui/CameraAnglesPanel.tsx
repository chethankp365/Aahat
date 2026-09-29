import React from 'react';
import { useSimStore, CameraMode } from '../state/simStore';
import {
  Video,
  Eye,
  Camera,
  Map,
  Sparkles,
  Compass,
  SquareCheck,
  Maximize2,
  Scan,
  Zap,
  Activity,
  Radio,
  Sliders,
} from 'lucide-react';

interface AngleOption {
  id: CameraMode;
  name: string;
  badge: string;
  description: string;
  icon: React.ElementType;
}

const CAMERA_ANGLES: AngleOption[] = [
  {
    id: 'front_low',
    name: 'Front 3/4 Nose',
    badge: 'Photo 1',
    description: 'Low angle perspective near wheels & pistons',
    icon: Compass,
  },
  {
    id: 'side_profile',
    name: 'Side Elevation',
    badge: 'Photo 2',
    description: 'Full profile view of engine, tender & coach',
    icon: Scan,
  },
  {
    id: 'rear_iso',
    name: 'Rear High Iso',
    badge: 'Photo 3',
    description: 'Overhead view of white carriage & dual tracks',
    icon: Maximize2,
  },
  {
    id: 'head_on',
    name: 'Direct Front',
    badge: 'Photo 4',
    description: 'Head-on view of smokebox door & headlights',
    icon: SquareCheck,
  },
  {
    id: 'chase',
    name: 'Dynamic Chase',
    badge: 'Tracking',
    description: 'Smooth follow camera behind locomotive',
    icon: Video,
  },
  {
    id: 'sensor',
    name: 'Sensor Track',
    badge: 'Close-up',
    description: 'Track-level CV & laser beam inspection',
    icon: Camera,
  },
  {
    id: 'top',
    name: 'Aerial Drone',
    badge: 'Top Map',
    description: 'High altitude top-down GIS perspective',
    icon: Map,
  },
  {
    id: 'cinematic',
    name: 'Cinematic Orbit',
    badge: 'Drone',
    description: '360° dynamic rotating sweep around train',
    icon: Sparkles,
  },
  {
    id: 'orbit',
    name: 'Free Manual Orbit',
    badge: 'Manual',
    description: 'Drag, rotate, and zoom freely with mouse',
    icon: Eye,
  },
];

export function CameraAnglesPanel() {
  const cameraMode = useSimStore((s) => s.cameraMode);
  const setCameraMode = useSimStore((s) => s.setCameraMode);
  const setSelectedSensor4D = useSimStore((s) => s.setSelectedSensor4D);

  return (
    <div className="flex flex-col gap-3 p-3.5 bg-slate-900/90 backdrop-blur-xl border border-slate-800 rounded-2xl shadow-2xl text-slate-200">
      {/* Panel Header */}
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <Camera className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-100">
              Camera View Angles
            </h3>
            <p className="text-[10px] text-slate-400 font-mono">Select perspective preset</p>
          </div>
        </div>
        <span className="px-2 py-0.5 text-[10px] font-mono rounded-full bg-slate-800 text-cyan-400 border border-cyan-500/30">
          9 Views
        </span>
      </div>

      {/* Grid of Camera Angle Presets */}
      <div className="grid grid-cols-1 gap-1.5 max-h-56 overflow-y-auto pr-1 custom-scrollbar">
        {CAMERA_ANGLES.map((angle) => {
          const Icon = angle.icon;
          const isActive = cameraMode === angle.id;

          return (
            <button
              key={angle.id}
              onClick={() => setCameraMode(angle.id)}
              className={`group relative flex items-center justify-between p-2 rounded-xl text-left transition-all border ${
                isActive
                  ? 'bg-gradient-to-r from-cyan-950/80 to-slate-900 border-cyan-500/60 shadow-lg shadow-cyan-500/10'
                  : 'bg-slate-950/50 border-slate-800/80 hover:bg-slate-800/60 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <div
                  className={`p-1.5 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-cyan-500 text-slate-950'
                      : 'bg-slate-800 text-slate-400 group-hover:text-cyan-400 group-hover:bg-slate-700'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-slate-200 group-hover:text-white flex items-center gap-1.5">
                    {angle.name}
                  </div>
                  <div className="text-[10px] text-slate-400 line-clamp-1">{angle.description}</div>
                </div>
              </div>

              <span
                className={`text-[9px] font-mono px-1.5 py-0.5 rounded-md shrink-0 ${
                  isActive
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                    : 'bg-slate-800/80 text-slate-400'
                }`}
              >
                {angle.badge}
              </span>
            </button>
          );
        })}
      </div>

      {/* 4D Sensor Inspection Trigger Buttons */}
      <div className="border-t border-slate-800/80 pt-2.5 flex flex-col gap-1.5">
        <div className="flex items-center justify-between text-[11px] font-bold text-slate-300">
          <span className="flex items-center gap-1 text-purple-400 font-mono">
            <Radio className="w-3.5 h-3.5 animate-pulse" /> 4D Sensor Working View
          </span>
          <span className="text-[9px] text-slate-500 font-mono">Click for 4D Detail</span>
        </div>

        <div className="grid grid-cols-2 gap-1.5">
          <button
            onClick={() => setSelectedSensor4D('optical')}
            className="flex items-center gap-1.5 p-1.5 rounded-lg bg-sky-950/40 hover:bg-sky-900/60 border border-sky-500/30 text-sky-300 text-[11px] font-mono font-medium transition-all"
          >
            <Camera className="w-3 h-3 text-sky-400" /> Optical CV
          </button>
          <button
            onClick={() => setSelectedSensor4D('acoustic')}
            className="flex items-center gap-1.5 p-1.5 rounded-lg bg-purple-950/40 hover:bg-purple-900/60 border border-purple-500/30 text-purple-300 text-[11px] font-mono font-medium transition-all"
          >
            <Zap className="w-3 h-3 text-purple-400" /> Acoustic 4D
          </button>
          <button
            onClick={() => setSelectedSensor4D('accelerometer')}
            className="flex items-center gap-1.5 p-1.5 rounded-lg bg-emerald-950/40 hover:bg-emerald-900/60 border border-emerald-500/30 text-emerald-300 text-[11px] font-mono font-medium transition-all"
          >
            <Activity className="w-3 h-3 text-emerald-400" /> IMU Accel
          </button>
          <button
            onClick={() => setSelectedSensor4D('laser')}
            className="flex items-center gap-1.5 p-1.5 rounded-lg bg-cyan-950/40 hover:bg-cyan-900/60 border border-cyan-500/30 text-cyan-300 text-[11px] font-mono font-medium transition-all"
          >
            <Sliders className="w-3 h-3 text-cyan-400" /> LiDAR 4D
          </button>
        </div>
      </div>
    </div>
  );
}
