import React, { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { useSimStore } from '../state/simStore';
import { getTrackFrameAt } from '../sim/trackGenerator';

/**
 * Exponential dampening utility for smooth, frame-rate independent vector interpolation
 */
function dampVector3(current: THREE.Vector3, target: THREE.Vector3, lambda: number, delta: number) {
  current.x = THREE.MathUtils.damp(current.x, target.x, lambda, delta);
  current.y = THREE.MathUtils.damp(current.y, target.y, lambda, delta);
  current.z = THREE.MathUtils.damp(current.z, target.z, lambda, delta);
}

export function CameraRig() {
  const cameraMode = useSimStore((s) => s.cameraMode);
  const trackSpline = useSimStore((s) => s.trackSpline);
  const trackLength = useSimStore((s) => s.trackLength);
  const vehicleProgress = useSimStore((s) => s.vehicleProgress);
  const selectedDefectId = useSimStore((s) => s.selectedDefectId);
  const getActiveDefects = useSimStore((s) => s.getActiveDefects);

  const { camera } = useThree();
  const orbitRef = useRef<any>(null!);
  const currentLookAt = useRef<THREE.Vector3>(new THREE.Vector3(0, 0, 0));

  useFrame((state, delta) => {
    if (!trackSpline) return;

    // Clamp delta to prevent huge jumps on lag spike or tab switch
    const safeDelta = Math.min(delta, 0.1);

    let targetCamPos = new THREE.Vector3();
    let targetLookAt = new THREE.Vector3();
    let dampLambda = 6.0; // Smooth damping factor

    // If a defect is selected, fly camera smoothly to focus on selected defect location
    if (selectedDefectId) {
      const activeDefects = getActiveDefects();
      const defect = activeDefects.find((d) => d.id === selectedDefectId);
      if (defect) {
        const u = defect.distance / trackLength;
        const { position, normal } = getTrackFrameAt(trackSpline, u);
        const defect3DPos = position.clone().addScaledVector(normal, 0.4);

        targetCamPos = defect3DPos.clone().add(new THREE.Vector3(4.5, 3.2, 4.5));
        targetLookAt = defect3DPos;
        dampLambda = 5.0;

        dampVector3(camera.position, targetCamPos, dampLambda, safeDelta);
        dampVector3(currentLookAt.current, targetLookAt, dampLambda, safeDelta);
        camera.lookAt(currentLookAt.current);

        if (orbitRef.current) {
          dampVector3(orbitRef.current.target, defect3DPos, dampLambda, safeDelta);
        }
        return;
      }
    }

    const { position, tangent, normal } = getTrackFrameAt(trackSpline, vehicleProgress);
    const vehiclePos = position.clone().addScaledVector(normal, 0.4);

    if (cameraMode === 'chase') {
      const offsetBack = tangent.clone().multiplyScalar(-6.5);
      const offsetUp = normal.clone().multiplyScalar(3.2);
      targetCamPos = vehiclePos.clone().add(offsetBack).add(offsetUp);
      targetLookAt = vehiclePos.clone().add(tangent.clone().multiplyScalar(4.0));
      dampLambda = 6.0;
    } else if (cameraMode === 'sensor') {
      targetCamPos = vehiclePos.clone().addScaledVector(tangent, 1.2).addScaledVector(normal, 0.5);
      targetLookAt = vehiclePos.clone().addScaledVector(tangent, 15.0).addScaledVector(normal, -0.2);
      dampLambda = 12.0;
    } else if (cameraMode === 'top') {
      targetCamPos = vehiclePos.clone().add(new THREE.Vector3(0, 95, 1));
      targetLookAt = vehiclePos;
      dampLambda = 5.0;
    } else if (cameraMode === 'cinematic') {
      const t = state.clock.getElapsedTime() * 0.15;
      const cinU = (vehicleProgress + 0.08 + Math.sin(t) * 0.05) % 1.0;
      const cinFrame = getTrackFrameAt(trackSpline, cinU);

      targetCamPos = cinFrame.position.clone().add(new THREE.Vector3(12 * Math.cos(t), 6, 12 * Math.sin(t)));
      targetLookAt = vehiclePos;
      dampLambda = 3.5;
    } else if (cameraMode === 'orbit') {
      // In free orbit mode, let OrbitControls handle smooth camera motion
      if (orbitRef.current) {
        dampVector3(orbitRef.current.target, vehiclePos, 4.0, safeDelta);
      }
      return;
    }

    // Apply smooth exponential dampening to camera position and look-at target
    dampVector3(camera.position, targetCamPos, dampLambda, safeDelta);
    dampVector3(currentLookAt.current, targetLookAt, dampLambda, safeDelta);
    camera.lookAt(currentLookAt.current);
  });

  return (
    <OrbitControls
      ref={orbitRef}
      enabled={cameraMode === 'orbit'}
      enableDamping
      dampingFactor={0.05}
      maxPolarAngle={Math.PI / 2 - 0.02}
      minDistance={3}
      maxDistance={250}
    />
  );
}
