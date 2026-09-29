import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useSimStore } from '../state/simStore';
import { getTrackFrameAt } from '../sim/trackGenerator';
import { GAUGE_WIDTH } from '../sim/trackGenerator';

export function InspectionVehicle() {
  const vehicleRef = useRef<THREE.Group>(null!);
  const wheelRefs = useRef<THREE.Mesh[]>([]);

  const trackSpline = useSimStore((s) => s.trackSpline);
  const vehicleProgress = useSimStore((s) => s.vehicleProgress);
  const activeSensors = useSimStore((s) => s.activeSensors);
  const vehicleSpeed = useSimStore((s) => s.vehicleSpeedKmH);

  // Smooth position & rotation update along spline
  useFrame((_, delta) => {
    if (!vehicleRef.current || !trackSpline) return;

    // Calculate frame position, tangent vector, normal, binormal, and curve banking angle
    const { position, tangent, normal, binormal, bankAngle } = getTrackFrameAt(trackSpline, vehicleProgress);

    // Set position slightly above rail head surface
    const vehiclePos = position.clone().addScaledVector(normal, 0.28);
    vehicleRef.current.position.lerp(vehiclePos, 0.85);

    // Construct rotation matrix to orient front of vehicle to spline tangent
    const rotMat = new THREE.Matrix4().makeBasis(binormal, normal, tangent);
    const targetQuat = new THREE.Quaternion().setFromRotationMatrix(rotMat);

    // Apply curve banking roll angle along tangent axis
    const bankQuat = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), bankAngle);
    targetQuat.multiply(bankQuat);

    vehicleRef.current.quaternion.slerp(targetQuat, 0.85);

    // Spin wheels according to speed
    const wheelSpinSpeed = (vehicleSpeed / 3.6) * delta * 5.0;
    wheelRefs.current.forEach((wheel) => {
      if (wheel) {
        wheel.rotation.x += wheelSpinSpeed;
      }
    });
  });

  const now = Date.now();

  return (
    <group ref={vehicleRef} name="InspectionVehicle">
      {/* Main Yellow/Slate Industrial Trolley Chassis Frame */}
      <mesh position={[0, 0.35, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.75, 0.45, 2.8]} />
        <meshStandardMaterial color="#f59e0b" roughness={0.35} metalness={0.65} />
      </mesh>

      {/* Top Protective Roll Cage Bar Structure */}
      <mesh position={[0, 0.85, 0]} castShadow>
        <boxGeometry args={[1.65, 0.55, 2.5]} />
        <meshStandardMaterial color="#1e293b" wireframe roughness={0.4} />
      </mesh>

      {/* Front Nose Aerodynamic Bumper */}
      <mesh position={[0, 0.25, 1.45]} castShadow>
        <boxGeometry args={[1.6, 0.35, 0.3]} />
        <meshStandardMaterial color="#0f172a" roughness={0.3} metalness={0.8} />
      </mesh>

      {/* 4 Flanged Steel Wheels mounted on track gauge width */}
      {[-GAUGE_WIDTH / 2, GAUGE_WIDTH / 2].map((xSide, xIdx) =>
        [-0.9, 0.9].map((zPos, zIdx) => {
          const idx = xIdx * 2 + zIdx;
          return (
            <group key={idx} position={[xSide, 0.1, zPos]}>
              {/* Steel Wheel Mesh */}
              <mesh
                ref={(el) => {
                  if (el) wheelRefs.current[idx] = el;
                }}
                rotation={[0, 0, Math.PI / 2]}
                castShadow
              >
                <cylinderGeometry args={[0.22, 0.22, 0.12, 24]} />
                <meshStandardMaterial color="#64748b" metalness={0.92} roughness={0.15} />
              </mesh>

              {/* Wheel Flange Rim */}
              <mesh position={[xSide < 0 ? -0.06 : 0.06, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
                <cylinderGeometry args={[0.26, 0.26, 0.02, 24]} />
                <meshStandardMaterial color="#475569" metalness={0.95} roughness={0.1} />
              </mesh>
            </group>
          );
        })
      )}

      {/* High-Intensity Dual LED Headlights */}
      {[-0.6, 0.6].map((x, i) => (
        <group key={i} position={[x, 0.38, 1.5]}>
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.12, 0.12, 0.08, 16]} />
            <meshStandardMaterial color="#38bdf8" emissive="#38bdf8" emissiveIntensity={1.5} />
          </mesh>
          <spotLight
            position={[0, 0, 0.1]}
            target-position={[0, -0.5, 12]}
            angle={0.45}
            penumbra={0.3}
            intensity={12}
            color="#e0f2fe"
            castShadow
          />
        </group>
      ))}

      {/* ================= MOUNTED SENSORS ================= */}

      {/* 1. OPTICAL STEREO CAMERA MODULE */}
      <group position={[0, 0.72, 1.35]}>
        {/* Camera Base Housing */}
        <mesh castShadow>
          <boxGeometry args={[0.45, 0.22, 0.25]} />
          <meshStandardMaterial color="#0f172a" metalness={0.8} />
        </mesh>
        {/* Dual Camera Lenses */}
        {[-0.14, 0.14].map((lx, lIdx) => (
          <mesh key={lIdx} position={[lx, 0, 0.14]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.06, 0.06, 0.05, 16]} />
            <meshStandardMaterial
              color="#0284c7"
              emissive={activeSensors.optical ? '#0284c7' : '#000000'}
              emissiveIntensity={activeSensors.optical ? 1.8 + Math.sin(now / 200) * 0.4 : 0}
            />
          </mesh>
        ))}
      </group>

      {/* 2. ULTRASONIC ACOUSTIC MICROPHONE ARRAY MODULE */}
      <group position={[-0.65, 0.65, 0.6]}>
        {/* Transducer Plate */}
        <mesh castShadow>
          <boxGeometry args={[0.25, 0.3, 0.25]} />
          <meshStandardMaterial color="#1e1b4b" metalness={0.7} />
        </mesh>
        {/* Glowing Acoustic Ring Sensor */}
        <mesh position={[0, -0.16, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.1, 0.025, 16, 32]} />
          <meshStandardMaterial
            color="#a855f7"
            emissive={activeSensors.acoustic ? '#a855f7' : '#000000'}
            emissiveIntensity={activeSensors.acoustic ? 2.0 + Math.sin(now / 150) * 0.6 : 0}
          />
        </mesh>
      </group>

      {/* 3. ACCELEROMETER / IMU SENSOR BOX */}
      <group position={[0.65, 0.65, 0.6]}>
        {/* Heavy Duty IMU Housing */}
        <mesh castShadow>
          <boxGeometry args={[0.28, 0.25, 0.28]} />
          <meshStandardMaterial color="#064e3b" roughness={0.4} />
        </mesh>
        {/* Pulsing Green Status Indicator LED */}
        <mesh position={[0, 0.14, 0]}>
          <sphereGeometry args={[0.05, 16, 16]} />
          <meshStandardMaterial
            color="#22c55e"
            emissive={activeSensors.accelerometer ? '#22c55e' : '#000000'}
            emissiveIntensity={activeSensors.accelerometer ? 2.2 + Math.sin(now / 120) * 0.8 : 0}
          />
        </mesh>
      </group>

      {/* 4. GPS / ROTATING LIDAR SCANNER POD */}
      <group position={[0, 1.25, 0]}>
        {/* Antenna Pole Mount */}
        <mesh castShadow>
          <cylinderGeometry args={[0.04, 0.04, 0.35, 12]} />
          <meshStandardMaterial color="#475569" metalness={0.8} />
        </mesh>
        {/* Dome Pod */}
        <mesh position={[0, 0.22, 0]} castShadow>
          <cylinderGeometry args={[0.22, 0.22, 0.16, 24]} />
          <meshStandardMaterial color="#0284c7" metalness={0.6} roughness={0.2} />
        </mesh>
        {/* Pulsing LiDAR Beam Ring */}
        <mesh position={[0, 0.31, 0]}>
          <cylinderGeometry args={[0.23, 0.23, 0.03, 24]} />
          <meshStandardMaterial
            color="#06b6d4"
            emissive={activeSensors.laser ? '#06b6d4' : '#000000'}
            emissiveIntensity={activeSensors.laser ? 2.5 + Math.sin(now / 100) * 1.0 : 0}
          />
        </mesh>
      </group>

      {/* Underbody Laser Scanner Sheet Emitter */}
      <mesh position={[0, -0.05, 0.8]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.08, 0.08, 1.4, 16]} />
        <meshStandardMaterial
          color="#10b981"
          emissive="#10b981"
          emissiveIntensity={activeSensors.laser ? 1.5 : 0.1}
        />
      </mesh>
    </group>
  );
}
