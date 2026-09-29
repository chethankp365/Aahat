import React, { useMemo } from 'react';
import { Sky } from '@react-three/drei';
import * as THREE from 'three';
import { useSimStore } from '../state/simStore';

export function Environment() {
  const trackSpline = useSimStore((s) => s.trackSpline);

  // Instanced side poles (telegraph / signal poles along track)
  const polePositions = useMemo(() => {
    if (!trackSpline) return [];
    const totalLen = trackSpline.getLength();
    const count = Math.floor(totalLen / 35);
    const poles = [];

    for (let i = 0; i <= count; i++) {
      const u = (i * 35) / totalLen;
      if (u <= 1.0) {
        const pt = trackSpline.getPointAt(u);
        const tan = trackSpline.getTangentAt(u);
        const normal = new THREE.Vector3(0, 1, 0);
        const side = new THREE.Vector3().crossVectors(tan, normal).normalize();
        
        // Left side pole offset
        const leftPole = pt.clone().addScaledVector(side, -4.2);
        poles.push({ pos: leftPole, rotY: Math.atan2(tan.x, tan.z) });
      }
    }

    return poles;
  }, [trackSpline]);

  return (
    <group name="OutdoorEnvironment">
      {/* Drei Sky Environment */}
      <Sky
        distance={450000}
        sunPosition={[120, 50, 150]}
        inclination={0.55}
        azimuth={0.22}
        mieCoefficient={0.005}
        mieDirectionalG={0.8}
        rayleigh={0.6}
        turbidity={8}
      />

      {/* Atmospheric Lighting */}
      <ambientLight intensity={0.65} color="#e0f2fe" />
      <directionalLight
        position={[120, 90, 150]}
        intensity={1.8}
        color="#fffbeb"
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-near={0.5}
        shadow-camera-far={600}
        shadow-camera-left={-250}
        shadow-camera-right={250}
        shadow-camera-top={250}
        shadow-camera-bottom={-250}
        shadow-bias={-0.0001}
      />
      <directionalLight position={[-80, 40, -100]} intensity={0.4} color="#38bdf8" />

      {/* Ground Terrain Base Plane */}
      <mesh position={[0, -0.6, -200]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[1200, 1200]} />
        <meshStandardMaterial color="#1e293b" roughness={0.95} metalness={0.05} />
      </mesh>

      {/* Side Catenary / Telegraph Poles */}
      {polePositions.map((pole, idx) => (
        <group key={idx} position={pole.pos} rotation={[0, pole.rotY, 0]}>
          {/* Main Wooden/Steel Pole */}
          <mesh position={[0, 4.0, 0]} castShadow>
            <cylinderGeometry args={[0.12, 0.18, 8.0, 12]} />
            <meshStandardMaterial color="#334155" roughness={0.7} />
          </mesh>
          {/* Cross arm */}
          <mesh position={[0, 7.2, 0]} castShadow>
            <boxGeometry args={[1.8, 0.12, 0.12]} />
            <meshStandardMaterial color="#1e293b" />
          </mesh>
          {/* Insulator caps */}
          {[-0.7, 0, 0.7].map((cx, cIdx) => (
            <mesh key={cIdx} position={[cx, 7.35, 0]}>
              <cylinderGeometry args={[0.05, 0.05, 0.18, 12]} />
              <meshStandardMaterial color="#38bdf8" roughness={0.2} />
            </mesh>
          ))}
        </group>
      ))}
    </group>
  );
}
