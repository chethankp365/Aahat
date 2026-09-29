import { create } from 'zustand';
import * as THREE from 'three';
import { getTrackSpline, getTrackLength } from '../sim/trackGenerator';
import { initialDefects, RailDefect, getDefectStateAtPass, INSPECTION_PASSES } from '../sim/defectEngine';

export type CameraMode = 'orbit' | 'chase' | 'top' | 'sensor' | 'cinematic';

export interface ActiveSensors {
  optical: boolean;
  acoustic: boolean;
  accelerometer: boolean;
  thermal: boolean;
  laser: boolean;
}

export interface LiveTelemetry {
  vibrationG: number;
  acousticDb: number;
  gaugeDevMm: number;
  railTempC: number;
  tqi: number;
  derailmentRisk: number;
}

interface SimStoreState {
  // Track geometry & spline
  trackSpline: THREE.CatmullRomCurve3;
  trackLength: number;

  // Simulation playback & 4D timeline
  vehicleProgress: number; // 0.0 to 1.0 along spline
  vehicleSpeedKmH: number; // km/h (0 to 120)
  isPlaying: boolean;
  timeMultiplier: number; // 0.5x, 1x, 4x, 20x (time-lapse)
  currentPassNumber: number; // 1 to 5 (Day 1 to Day 60)

  // Camera & view controls
  cameraMode: CameraMode;
  enablePostProcessing: boolean;
  showOnboarding: boolean;

  // Sensors configuration
  activeSensors: ActiveSensors;

  // Defect detection data & 4D Forecast
  rawDefects: RailDefect[];
  selectedDefectId: string | null;
  filterSeverity: 'all' | 'critical' | 'high' | 'medium' | 'low' | 'normal';
  showPredictiveForecast: boolean;

  // Live telemetry signals
  telemetry: LiveTelemetry;

  // Debug toggles
  showWireframe: boolean;
  showSensorBeams: boolean;
  showSleepers: boolean;

  // Actions
  setVehicleProgress: (progress: number) => void;
  setVehicleSpeed: (speed: number) => void;
  togglePlay: () => void;
  setIsPlaying: (playing: boolean) => void;
  setTimeMultiplier: (mult: number) => void;
  setPassNumber: (passNum: number) => void;
  togglePredictiveForecast: () => void;
  togglePostProcessing: () => void;
  setShowOnboarding: (show: boolean) => void;
  setCameraMode: (mode: CameraMode) => void;
  toggleSensor: (sensorKey: keyof ActiveSensors) => void;
  selectDefect: (id: string | null) => void;
  updateDefectStatus: (id: string, status: import('../sim/defectEngine').DefectStatus) => void;
  acknowledgeDefect: (id: string) => void;
  setFilterSeverity: (sev: 'all' | 'critical' | 'high' | 'medium' | 'low' | 'normal') => void;
  updateTick: (deltaSeconds: number) => void;
  toggleDebugOption: (key: 'showWireframe' | 'showSensorBeams' | 'showSleepers') => void;

  // Computed helper to get defects evaluated at current active pass
  getActiveDefects: () => ReturnType<typeof getDefectStateAtPass>[];
}

const spline = getTrackSpline();
const length = getTrackLength(spline);

export const useSimStore = create<SimStoreState>((set, get) => ({
  trackSpline: spline,
  trackLength: length,

  vehicleProgress: 0.05,
  vehicleSpeedKmH: 45,
  isPlaying: true,
  timeMultiplier: 1.0,
  currentPassNumber: 3, // Start at Pass #3 (Day 30) for rich degradation visibility

  cameraMode: 'chase',
  enablePostProcessing: false,
  showOnboarding: true,

  activeSensors: {
    optical: true,
    acoustic: true,
    accelerometer: true,
    thermal: true,
    laser: true,
  },

  rawDefects: initialDefects,
  selectedDefectId: null,
  filterSeverity: 'all',
  showPredictiveForecast: true,

  telemetry: {
    vibrationG: 0.18,
    acousticDb: 64.2,
    gaugeDevMm: +1.2,
    railTempC: 29.4,
    tqi: 88.5,
    derailmentRisk: 4.2,
  },

  showWireframe: false,
  showSensorBeams: true,
  showSleepers: true,

  setVehicleProgress: (progress) => set({ vehicleProgress: Math.max(0, Math.min(1, progress)) }),

  setVehicleSpeed: (speed) => set({ vehicleSpeedKmH: Math.max(0, Math.min(120, speed)) }),

  togglePlay: () => set((state) => ({ isPlaying: !state.isPlaying })),

  setIsPlaying: (playing) => set({ isPlaying: playing }),

  setTimeMultiplier: (mult) => set({ timeMultiplier: mult }),

  setPassNumber: (passNum) => set({ currentPassNumber: Math.max(1, Math.min(INSPECTION_PASSES.length, passNum)) }),

  togglePredictiveForecast: () => set((state) => ({ showPredictiveForecast: !state.showPredictiveForecast })),

  togglePostProcessing: () => set((state) => ({ enablePostProcessing: !state.enablePostProcessing })),

  setShowOnboarding: (show) => set({ showOnboarding: show }),

  setCameraMode: (mode) => set({ cameraMode: mode }),

  toggleSensor: (sensorKey) =>
    set((state) => ({
      activeSensors: {
        ...state.activeSensors,
        [sensorKey]: !state.activeSensors[sensorKey],
      },
    })),

  selectDefect: (id) => set({ selectedDefectId: id }),

  updateDefectStatus: (id, status) =>
    set((state) => ({
      rawDefects: state.rawDefects.map((d) => (d.id === id ? { ...d, status } : d)),
    })),

  acknowledgeDefect: (id) =>
    set((state) => ({
      rawDefects: state.rawDefects.map((d) => (d.id === id ? { ...d, status: 'confirmed' } : d)),
    })),

  setFilterSeverity: (sev) => set({ filterSeverity: sev }),

  toggleDebugOption: (key) => set((state) => ({ [key]: !state[key] })),

  getActiveDefects: () => {
    const { rawDefects, currentPassNumber } = get();
    return rawDefects.map(d => getDefectStateAtPass(d, currentPassNumber));
  },

  updateTick: (deltaSeconds) => {
    const { isPlaying, vehicleSpeedKmH, timeMultiplier, vehicleProgress, trackLength, currentPassNumber, getActiveDefects } = get();
    if (!isPlaying || vehicleSpeedKmH <= 0) return;

    // Convert km/h to m/s: km/h / 3.6
    const speedMS = (vehicleSpeedKmH / 3.6) * timeMultiplier;
    const distanceTraveled = speedMS * deltaSeconds; // in meters
    const progressDelta = distanceTraveled / trackLength;

    let newProgress = vehicleProgress + progressDelta;
    let nextPass = currentPassNumber;

    // If vehicle completes a full traverse (loop wrap around)
    if (newProgress > 1.0) {
      newProgress = newProgress % 1.0;
      
      // Auto-increment pass in high-speed time-lapse mode (4x or 20x)
      if (timeMultiplier >= 4) {
        nextPass = currentPassNumber >= INSPECTION_PASSES.length ? 1 : currentPassNumber + 1;
      }
    }

    const currentDistMeters = newProgress * trackLength;
    const activeDefects = getActiveDefects();

    // Auto-detect defects as inspection vehicle passes them
    const updatedRawDefects = get().rawDefects.map((defect) => {
      const distDiff = Math.abs(defect.distance - currentDistMeters);
      if (distDiff < 4.0 && defect.status === 'unseen') {
        return { ...defect, status: 'detected' as const };
      }
      return defect;
    });

    // Calculate dynamic telemetry signals based on current position and nearby active defect
    const nearbyDefect = activeDefects.find((d) => Math.abs(d.distance - currentDistMeters) < 6.0);
    const noise = (Math.random() - 0.5) * 0.05;
    const vibrationBase = 0.15 + (vehicleSpeedKmH / 120) * 0.25;
    const vibSpike = nearbyDefect ? (nearbyDefect.severity === 'critical' ? 2.4 : nearbyDefect.severity === 'high' ? 1.4 : 0.7) : 0;

    const gaugeBase = Math.sin(newProgress * Math.PI * 20) * 1.5;
    const gaugeSpike = nearbyDefect?.type === 'gauge_spread' ? 11.5 : 0;

    const tempBase = 28 + Math.sin(newProgress * Math.PI * 4) * 3;
    const tempSpike = nearbyDefect?.type === 'thermal_anomaly' ? 38.0 : 0;

    set({
      vehicleProgress: newProgress,
      currentPassNumber: nextPass,
      rawDefects: updatedRawDefects,
      telemetry: {
        vibrationG: Math.max(0.05, vibrationBase + vibSpike + noise),
        acousticDb: Math.min(110, 60 + (vehicleSpeedKmH / 120) * 20 + (nearbyDefect ? 25 : 0) + noise * 10),
        gaugeDevMm: Number((gaugeBase + gaugeSpike).toFixed(1)),
        railTempC: Number((tempBase + tempSpike).toFixed(1)),
        tqi: Number((Math.max(50, 92 - (nearbyDefect ? 25 : 0) - (vehicleSpeedKmH > 80 ? 5 : 0))).toFixed(1)),
        derailmentRisk: Number((Math.min(95, 3 + (nearbyDefect ? (nearbyDefect.severity === 'critical' ? 48 : 22) : 0))).toFixed(1)),
      },
    });
  },
}));
