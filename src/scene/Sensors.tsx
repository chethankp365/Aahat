import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useSimStore } from '../state/simStore';
import { getTrackFrameAt, GAUGE_WIDTH } from '../sim/trackGenerator';

export function Sensors() {
  const trackSpline = useSimStore((s) => s.trackSpline);
  const trackLength = useSimStore((s) => s.trackLength);
  const vehicleProgress = useSimStore((s) => s.vehicleProgress);
  const activeSensors = useSimStore((s) => s.activeSensors);
  const showSensorBeams = useSimStore((s) => s.showSensorBeams);
  const getActiveDefects = useSimStore((s) => s.getActiveDefects);

  const laserGroupRef = useRef<THREE.Group>(null!);
  const visionBeamRef = useRef<THREE.Mesh>(null!);
  const acousticGroupRef = useRef<THREE.Group>(null!);
  const accelBeamRef = useRef<THREE.Mesh>(null!);
  const pulseRingRef = useRef<THREE.Mesh>(null!);

  useFrame(({ clock }) => {
    if (!trackSpline || !showSensorBeams) return;

    const { position, tangent, normal, binormal, bankAngle } = getTrackFrameAt(trackSpline, vehicleProgress);
    const vehiclePos = position.clone().addScaledVector(normal, 0.28);

    const rotMat = new THREE.Matrix4().makeBasis(binormal, normal, tangent);
    const targetQuat = new THREE.Quaternion().setFromRotationMatrix(rotMat);
    const bankQuat = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), bankAngle);
    targetQuat.multiply(bankQuat);

    // Sync sensor beam origins with vehicle position
    if (laserGroupRef.current) {
      laserGroupRef.current.position.copy(vehiclePos);
      laserGroupRef.current.quaternion.copy(targetQuat);
    }
    if (acousticGroupRef.current) {
      acousticGroupRef.current.position.copy(vehiclePos);
      acousticGroupRef.current.quaternion.copy(targetQuat);
    }

    const t = clock.getElapsedTime();

    // Pulse rings expansion animation
    if (pulseRingRef.current) {
      const scale = 1.0 + (t * 5.0) % 2.8;
      pulseRingRef.current.scale.set(scale, scale, 1);
      const mat = pulseRingRef.current.material as THREE.MeshBasicMaterial;
      if (mat) {
        mat.opacity = Math.max(0, 1.0 - scale / 3.8);
      }
    }

    // Oscillate beam intensity & width
    if (visionBeamRef.current) {
      const mat = visionBeamRef.current.material as THREE.MeshBasicMaterial;
      if (mat) mat.opacity = 0.35 + Math.sin(t * 12) * 0.15;
    }
    if (accelBeamRef.current) {
      const mat = accelBeamRef.current.material as THREE.MeshBasicMaterial;
      if (mat) mat.opacity = 0.4 + Math.sin(t * 15) * 0.2;
    }
  });

  if (!showSensorBeams) return null;

  const currentDist = vehicleProgress * trackLength;
  const activeDefects = getActiveDefects();
  const nearbyDefect = activeDefects.find((d) => Math.abs(d.distance - currentDist) < 6.0);
  const isDetecting = !!nearbyDefect;

  return (
    <group name="SensorsVisualFX">
      {/* 1. VISION CAMERA SENSING BEAM (Cyan Frustum Beam from Camera to Track) */}
      {activeSensors.optical && (
        <group ref={laserGroupRef}>
          {/* Cyan Pyramidal Beam Frustum */}
          <mesh ref={visionBeamRef} position={[0, 0.2, 0.9]} rotation={[0.45, 0, 0]}>
            <coneGeometry args={[0.9, 1.2, 4, 1, true]} />
            <meshBasicMaterial
              color={isDetecting ? '#f43f5e' : '#06b6d4'}
              side={THREE.DoubleSide}
              transparent
              opacity={0.4}
              wireframe={false}
            />
          </mesh>

          {/* Glowing Target Box Reticle on Track Surface */}
          <mesh position={[0, -0.28, 1.4]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[1.2, 0.8]} />
            <meshBasicMaterial
              color={isDetecting ? '#f43f5e' : '#06b6d4'}
              side={THREE.DoubleSide}
              transparent
              opacity={isDetecting ? 0.85 : 0.4}
            />
          </mesh>
        </group>
      )}

      {/* 2. ULTRASONIC ACOUSTIC MIC EXPANDING SENSING RINGS (Purple) */}
      {activeSensors.acoustic && (
        <group ref={acousticGroupRef}>
          <mesh ref={pulseRingRef} position={[-0.65, -0.28, 0.6]} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[0.2, 0.32, 32]} />
            <meshBasicMaterial color={isDetecting ? '#f43f5e' : '#c084fc'} side={THREE.DoubleSide} transparent opacity={0.7} />
          </mesh>
        </group>
      )}

      {/* 3. ACCELEROMETER / IMU SENSING BEAM (Emerald / Orange) */}
      {activeSensors.accelerometer && (
        <group ref={laserGroupRef}>
          {/* Vertical Signal Beam Line from Axle to Rail Surface */}
          <mesh ref={accelBeamRef} position={[0.65, 0.2, 0.6]} rotation={[0, 0, 0]}>
            <cylinderGeometry args={[0.03, 0.08, 0.8, 12]} />
            <meshBasicMaterial
              color={isDetecting ? '#f59e0b' : '#10b981'}
              transparent
              opacity={0.6}
            />
          </mesh>
          {/* Target Impact Point Spot on Rail Head */}
          <mesh position={[0.65, -0.28, 0.6]} rotation={[-Math.PI / 2, 0, 0]}>
            <circleGeometry args={[0.22, 24]} />
            <meshBasicMaterial color={isDetecting ? '#f59e0b' : '#10b981'} transparent opacity={0.8} />
          </mesh>
        </group>
      )}
    </group>
  );
}
