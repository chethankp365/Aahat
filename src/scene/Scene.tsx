import React from 'react';
import { Canvas } from '@react-three/fiber';
import { Track } from './Track';
import { InspectionVehicle } from './InspectionVehicle';
import { Sensors } from './Sensors';
import { DefectMarkers } from './DefectMarkers';
import { Environment } from './Environment';
import { CameraRig } from './CameraRig';

import { SceneEffects } from './Effects';

export function Scene() {
  return (
    <div className="absolute inset-0 w-full h-full bg-slate-950">
      <Canvas
        shadows
        camera={{ position: [0, 8, 15], fov: 55, near: 0.1, far: 1000 }}
        gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
      >
        <Environment />
        <Track />
        <InspectionVehicle />
        <Sensors />
        <DefectMarkers />
        <CameraRig />
        <SceneEffects />
      </Canvas>
    </div>
  );
}
