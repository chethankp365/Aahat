import React, { useMemo, useRef } from 'react';
import { Sky } from '@react-three/drei';
import * as THREE from 'three';
import { useSimStore } from '../state/simStore';

export function Environment() {
  const trackSpline = useSimStore((s) => s.trackSpline);
  const currentPassNumber = useSimStore((s) => s.currentPassNumber);

  // 4D Season Color Palette based on inspection pass timeline
  const seasonColors = useMemo(() => {
    switch (currentPassNumber) {
      case 1: // Spring Bloom
        return {
          grass: '#16a34a',
          pine: '#15803d',
          oak: '#22c55e',
          bush: '#4ade80',
          fog: '#e0f2fe',
        };
      case 2: // Early Summer
        return {
          grass: '#15803d',
          pine: '#166534',
          oak: '#15803d',
          bush: '#16a34a',
          fog: '#f0fdf4',
        };
      case 3: // High Summer
        return {
          grass: '#166534',
          pine: '#14532d',
          oak: '#166534',
          bush: '#15803d',
          fog: '#ecfdf5',
        };
      case 4: // Autumn Transition
        return {
          grass: '#65a30d',
          pine: '#15803d',
          oak: '#d97706',
          bush: '#ca8a04',
          fog: '#fef3c7',
        };
      case 5: // Alpine Misty Frost
      default:
        return {
          grass: '#334155',
          pine: '#1e293b',
          oak: '#475569',
          bush: '#64748b',
          fog: '#cbd5e1',
        };
    }
  }, [currentPassNumber]);

  // 1. Generate 300+ Nature Trees & Bushes scattered along track corridor
  const { pineTrees, oakTrees, bushes, mountains } = useMemo(() => {
    if (!trackSpline)
      return { pineTrees: [], oakTrees: [], bushes: [], mountains: [] };

    const totalLen = trackSpline.getLength();
    const pines = [];
    const oaks = [];
    const bushList = [];
    const mtnList = [];

    // Seeded random helper for deterministic procedural generation
    let seed = 42;
    const random = () => {
      const x = Math.sin(seed++) * 10000;
      return x - Math.floor(x);
    };

    // Generate Trees along both sides of track spline
    const sampleCount = 180;
    for (let i = 0; i < sampleCount; i++) {
      const u = i / sampleCount;
      const pt = trackSpline.getPointAt(u);
      const tan = trackSpline.getTangentAt(u);
      const up = new THREE.Vector3(0, 1, 0);
      const side = new THREE.Vector3().crossVectors(tan, up).normalize();

      // Left & Right offsets (keeping track corridor clear by 6m to 90m)
      const leftDist = 7 + random() * 85;
      const rightDist = 7 + random() * 85;

      const leftPos = pt.clone().addScaledVector(side, -leftDist);
      const rightPos = pt.clone().addScaledVector(side, rightDist);

      // Height variation on hills
      leftPos.y = Math.sin(leftPos.x * 0.02) * 3.5 + Math.cos(leftPos.z * 0.02) * 2.5;
      rightPos.y = Math.sin(rightPos.x * 0.02) * 3.5 + Math.cos(rightPos.z * 0.02) * 2.5;

      const leftScale = 0.8 + random() * 0.8;
      const rightScale = 0.8 + random() * 0.8;

      if (i % 2 === 0) {
        pines.push({ pos: leftPos, scale: leftScale, rotY: random() * Math.PI * 2 });
        oaks.push({ pos: rightPos, scale: rightScale, rotY: random() * Math.PI * 2 });
      } else {
        oaks.push({ pos: leftPos, scale: leftScale, rotY: random() * Math.PI * 2 });
        pines.push({ pos: rightPos, scale: rightScale, rotY: random() * Math.PI * 2 });
      }

      // Add ground shrubs / bushes near track edge
      if (i % 3 === 0) {
        const bushLeft = pt.clone().addScaledVector(side, -(3.2 + random() * 4.0));
        const bushRight = pt.clone().addScaledVector(side, 3.2 + random() * 4.0);
        bushLeft.y = 0.1;
        bushRight.y = 0.1;
        bushList.push({ pos: bushLeft, scale: 0.5 + random() * 0.5 });
        bushList.push({ pos: bushRight, scale: 0.5 + random() * 0.5 });
      }
    }

    // Generate distant background Mountain Peaks
    for (let m = 0; m < 14; m++) {
      const angle = (m / 14) * Math.PI * 2;
      const dist = 320 + random() * 180;
      const mX = Math.cos(angle) * dist;
      const mZ = Math.sin(angle) * dist - 200;
      const height = 90 + random() * 120;
      const radius = 100 + random() * 90;
      mtnList.push({ pos: new THREE.Vector3(mX, height / 2 - 10, mZ), radius, height });
    }

    return { pineTrees: pines, oakTrees: oaks, bushes: bushList, mountains: mtnList };
  }, [trackSpline]);

  // Catenary telegraph poles along track
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

        const leftPole = pt.clone().addScaledVector(side, -4.2);
        poles.push({ pos: leftPole, rotY: Math.atan2(tan.x, tan.z) });
      }
    }

    return poles;
  }, [trackSpline]);

  return (
    <group name="OutdoorNatureEnvironment">
      {/* Dynamic 4D Atmospheric Mist Fog */}
      <fogExp2 attach="fog" color={seasonColors.fog} density={0.0014} />

      {/* Drei Sky Atmosphere */}
      <Sky
        distance={450000}
        sunPosition={[140, 60, 120]}
        inclination={0.52}
        azimuth={0.25}
        mieCoefficient={0.003}
        mieDirectionalG={0.82}
        rayleigh={0.7}
        turbidity={6}
      />

      {/* Natural Sunlight & Ambient Illumination */}
      <ambientLight intensity={0.75} color="#f0fdf4" />
      <directionalLight
        position={[140, 110, 120]}
        intensity={2.2}
        color="#fef08a"
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-near={0.5}
        shadow-camera-far={650}
        shadow-camera-left={-300}
        shadow-camera-right={300}
        shadow-camera-top={300}
        shadow-camera-bottom={-300}
        shadow-bias={-0.0001}
      />
      <directionalLight position={[-100, 50, -120]} intensity={0.5} color="#38bdf8" />

      {/* Lush Emerald Green Ground Meadow Terrain */}
      <mesh position={[0, -0.4, -200]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[1400, 1400, 48, 48]} />
        <meshStandardMaterial color={seasonColors.grass} roughness={0.85} metalness={0.05} />
      </mesh>

      {/* Rolling Meadow Hills on Left & Right Sides */}
      {[-45, 45].map((xSide, i) => (
        <mesh
          key={i}
          position={[xSide * 2, -2, -200]}
          rotation={[-Math.PI / 2, 0, xSide > 0 ? 0.3 : -0.3]}
          receiveShadow
        >
          <planeGeometry args={[600, 1200, 32, 32]} />
          <meshStandardMaterial color={seasonColors.grass} roughness={0.9} metalness={0.05} />
        </mesh>
      ))}

      {/* ========================================================================= */}
      {/* 2. INSTANCED NATURE TREES (Pine & Deciduous Oak Trees)                    */}
      {/* ========================================================================= */}

      {/* Pine Trees (Coniferous Pines) */}
      {pineTrees.map((tree, idx) => (
        <group
          key={`pine-${idx}`}
          position={tree.pos}
          rotation={[0, tree.rotY, 0]}
          scale={[tree.scale, tree.scale, tree.scale]}
        >
          {/* Wooden Trunk */}
          <mesh position={[0, 1.8, 0]} castShadow>
            <cylinderGeometry args={[0.2, 0.35, 3.6, 12]} />
            <meshStandardMaterial color="#451a03" roughness={0.9} />
          </mesh>
          {/* Layered Pine Canopies */}
          <mesh position={[0, 3.8, 0]} castShadow>
            <coneGeometry args={[1.8, 2.6, 16]} />
            <meshStandardMaterial color={seasonColors.pine} roughness={0.6} />
          </mesh>
          <mesh position={[0, 5.2, 0]} castShadow>
            <coneGeometry args={[1.4, 2.2, 16]} />
            <meshStandardMaterial color={seasonColors.pine} roughness={0.6} />
          </mesh>
          <mesh position={[0, 6.4, 0]} castShadow>
            <coneGeometry args={[0.9, 1.8, 16]} />
            <meshStandardMaterial color={seasonColors.oak} roughness={0.5} />
          </mesh>
        </group>
      ))}

      {/* Oak Trees (Deciduous Rounded Canopies) */}
      {oakTrees.map((tree, idx) => (
        <group
          key={`oak-${idx}`}
          position={tree.pos}
          rotation={[0, tree.rotY, 0]}
          scale={[tree.scale, tree.scale, tree.scale]}
        >
          {/* Trunk */}
          <mesh position={[0, 2.2, 0]} castShadow>
            <cylinderGeometry args={[0.28, 0.45, 4.4, 12]} />
            <meshStandardMaterial color="#3b1f1e" roughness={0.9} />
          </mesh>
          {/* Broad Foliage Sphere Canopy */}
          <mesh position={[0, 5.0, 0]} castShadow>
            <sphereGeometry args={[2.4, 16, 16]} />
            <meshStandardMaterial color={seasonColors.oak} roughness={0.7} />
          </mesh>
          <mesh position={[0.8, 4.5, 0.6]} castShadow>
            <sphereGeometry args={[1.6, 16, 16]} />
            <meshStandardMaterial color={seasonColors.pine} roughness={0.7} />
          </mesh>
        </group>
      ))}

      {/* Wild Shrub & Bush Clusters along track corridor */}
      {bushes.map((bush, idx) => (
        <mesh
          key={`bush-${idx}`}
          position={bush.pos}
          scale={[bush.scale, bush.scale, bush.scale]}
          castShadow
        >
          <sphereGeometry args={[0.8, 12, 12]} />
          <meshStandardMaterial color={seasonColors.bush} roughness={0.8} />
        </mesh>
      ))}

      {/* Background Mountain Peaks */}
      {mountains.map((mtn, idx) => (
        <group key={`mtn-${idx}`} position={mtn.pos}>
          {/* Mountain Body */}
          <mesh castShadow>
            <coneGeometry args={[mtn.radius, mtn.height, 24]} />
            <meshStandardMaterial color="#334155" roughness={0.95} metalness={0.1} />
          </mesh>
          {/* Snow / Alpine Cap */}
          <mesh position={[0, mtn.height * 0.35, 0]}>
            <coneGeometry args={[mtn.radius * 0.32, mtn.height * 0.32, 24]} />
            <meshStandardMaterial color="#f8fafc" roughness={0.4} />
          </mesh>
        </group>
      ))}

      {/* Catenary / Telegraph Poles along track side */}
      {polePositions.map((pole, idx) => (
        <group key={`pole-${idx}`} position={pole.pos} rotation={[0, pole.rotY, 0]}>
          <mesh position={[0, 4.0, 0]} castShadow>
            <cylinderGeometry args={[0.12, 0.18, 8.0, 12]} />
            <meshStandardMaterial color="#475569" roughness={0.7} />
          </mesh>
          <mesh position={[0, 7.2, 0]} castShadow>
            <boxGeometry args={[1.8, 0.12, 0.12]} />
            <meshStandardMaterial color="#1e293b" />
          </mesh>
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
