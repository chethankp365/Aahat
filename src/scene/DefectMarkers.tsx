import React from 'react';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { useSimStore } from '../state/simStore';
import { getTrackFrameAt, GAUGE_WIDTH } from '../sim/trackGenerator';
import { computePredictiveForecast, INSPECTION_PASSES } from '../sim/defectEngine';
import { fuseMultimodalSignals } from '../sim/riskEngine';
import { ShieldCheck, Zap } from 'lucide-react';

export function DefectMarkers() {
  const trackSpline = useSimStore((s) => s.trackSpline);
  const trackLength = useSimStore((s) => s.trackLength);
  const getActiveDefects = useSimStore((s) => s.getActiveDefects);
  const rawDefects = useSimStore((s) => s.rawDefects);
  const currentPassNumber = useSimStore((s) => s.currentPassNumber);
  const showPredictiveForecast = useSimStore((s) => s.showPredictiveForecast);
  const selectedDefectId = useSimStore((s) => s.selectedDefectId);
  const filterSeverity = useSimStore((s) => s.filterSeverity);
  const selectDefect = useSimStore((s) => s.selectDefect);

  if (!trackSpline) return null;

  const activeDefects = getActiveDefects();

  // Filter defects by selected severity filter
  const filteredDefects = activeDefects.filter((d) => {
    if (filterSeverity === 'all') return true;
    return d.severity === filterSeverity;
  });

  return (
    <group name="DefectMarkers3D">
      {filteredDefects.map((defect) => {
        const u = defect.distance / trackLength;
        const { position, normal, binormal } = getTrackFrameAt(trackSpline, u);

        // Position on left rail, right rail, or track centerline
        const railOffset = defect.railSide === 'left' ? -GAUGE_WIDTH / 2 : defect.railSide === 'right' ? GAUGE_WIDTH / 2 : 0;
        const markerPos = position.clone()
          .addScaledVector(binormal, railOffset)
          .addScaledVector(normal, 0.22); // Slightly above rail head

        const isSelected = selectedDefectId === defect.id;

        // Perform Multimodal Sensor Fusion calculation
        const fusionResult = fuseMultimodalSignals(
          94.5,
          defect.acousticDb,
          defect.vibrationG
        );

        // Color coding by severity
        const colorHex =
          defect.severity === 'critical'
            ? '#ef4444' // Red
            : defect.severity === 'high'
            ? '#f97316' // Orange
            : defect.severity === 'medium'
            ? '#eab308' // Yellow
            : defect.severity === 'low'
            ? '#06b6d4' // Cyan
            : '#10b981'; // Green

        // Find raw defect model for predictive forecasting calculation
        const rawDefect = rawDefects.find(rd => rd.id === defect.id);
        const forecast = rawDefect ? computePredictiveForecast(rawDefect, currentPassNumber) : null;

        // Visual crack size (scale factor based on crackLengthMm)
        const crackScaleFactor = Math.max(0.1, defect.crackLengthMm / 30);
        const isMultiConfirmed = fusionResult.isMultiSensorConfirmed;

        return (
          <group
            key={defect.id}
            position={markerPos}
            onClick={(e) => {
              e.stopPropagation();
              selectDefect(defect.id);
            }}
          >
            {/* PROCEDURAL CRACK / CORROSION BLEMISH DECAL ON RAIL SURFACE */}
            {defect.crackLengthMm > 0 && (
              <mesh position={[0, -0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                <boxGeometry args={[0.08 * (1 + crackScaleFactor), 0.4 * (1 + crackScaleFactor), 0.04]} />
                <meshStandardMaterial
                  color="#1e1b4b"
                  emissive={colorHex}
                  emissiveIntensity={isMultiConfirmed ? 1.5 : 0.8}
                  roughness={0.9}
                />
              </mesh>
            )}

            {/* Glowing 3D Base Ring (Larger & Brighter when Multi-Sensor Confirmed!) */}
            <mesh rotation={[-Math.PI / 2, 0, 0]}>
              <ringGeometry args={[0.3, isMultiConfirmed ? (isSelected ? 0.85 : 0.65) : (isSelected ? 0.65 : 0.48), 32]} />
              <meshBasicMaterial
                color={isMultiConfirmed ? '#f43f5e' : colorHex}
                transparent
                opacity={isMultiConfirmed ? 0.95 : (isSelected ? 0.9 : 0.6)}
              />
            </mesh>

            {/* Glowing Vertical Signal Pin */}
            <mesh position={[0, isMultiConfirmed ? 0.8 : 0.6, 0]}>
              <cylinderGeometry args={[0.04, 0.04, isMultiConfirmed ? 1.6 : 1.2, 16]} />
              <meshBasicMaterial color={isMultiConfirmed ? '#f43f5e' : colorHex} />
            </mesh>

            {/* Top Indicator Sphere */}
            <mesh position={[0, isMultiConfirmed ? 1.6 : 1.2, 0]}>
              <sphereGeometry args={[isMultiConfirmed ? 0.32 : (isSelected ? 0.28 : 0.2), 24, 24]} />
              <meshStandardMaterial
                color={isMultiConfirmed ? '#f43f5e' : colorHex}
                emissive={isMultiConfirmed ? '#f43f5e' : colorHex}
                emissiveIntensity={isMultiConfirmed ? 3.5 : (isSelected ? 2.5 : 1.2)}
              />
            </mesh>

            {/* PREDICTIVE FORECAST GHOST RING */}
            {showPredictiveForecast && forecast && forecast.daysRemainingUntilCritical > 0 && (
              <group position={[0, isMultiConfirmed ? 2.3 : 1.9, 0]}>
                <mesh rotation={[-Math.PI / 2, 0, 0]}>
                  <ringGeometry args={[0.6, 0.68, 32]} />
                  <meshBasicMaterial color="#f43f5e" wireframe transparent opacity={0.5} />
                </mesh>
              </group>
            )}

            {/* HTML Floating Tag Overlay */}
            <Html position={[0, isMultiConfirmed ? 2.0 : 1.6, 0]} center distanceFactor={18} zIndexRange={[100, 0]}>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  selectDefect(defect.id);
                }}
                className={`flex flex-col items-center gap-0.5 px-2.5 py-1 text-xs font-mono rounded-lg border shadow-xl transition-all transform hover:scale-110 cursor-pointer ${
                  isSelected
                    ? 'bg-slate-900 text-white border-cyan-400 ring-2 ring-cyan-400/50 scale-105'
                    : 'bg-slate-950/85 text-slate-200 border-slate-700 hover:border-slate-400'
                }`}
              >
                {/* Multi-Sensor Confirmation Badge */}
                {isMultiConfirmed && (
                  <div className="flex items-center gap-1 px-1.5 py-0.5 mb-0.5 rounded text-[9px] font-bold bg-rose-950 text-rose-300 border border-rose-500/60 shadow-lg shadow-rose-950/60 animate-pulse">
                    <ShieldCheck className="w-3 h-3 text-rose-400" />
                    MULTI-SENSOR CONFIRMED ({fusionResult.agreeingSensorCount}/3)
                  </div>
                )}

                <div className="flex items-center gap-1.5">
                  <span
                    className="w-2.5 h-2.5 rounded-full animate-pulse"
                    style={{ backgroundColor: colorHex }}
                  />
                  <span className="font-bold">{defect.id}</span>
                  <span className="uppercase text-[10px] font-bold px-1 rounded bg-slate-800 text-cyan-300">
                    {defect.severity}
                  </span>
                  {defect.status !== 'unseen' && defect.status !== 'detected' && (
                    <span className="uppercase text-[9px] font-bold px-1 rounded bg-indigo-950 text-indigo-300 border border-indigo-500/40">
                      {defect.status.replace(/_/g, ' ')}
                    </span>
                  )}
                </div>

                {showPredictiveForecast && forecast && (
                  <div className="text-[10px] text-rose-300 font-bold border-t border-slate-800/80 pt-0.5 w-full text-center">
                    Forecast: Critical in {forecast.daysRemainingUntilCritical} days
                  </div>
                )}
              </button>
            </Html>
          </group>
        );
      })}
    </group>
  );
}
