import React, { useMemo, useRef, useLayoutEffect } from 'react';
import * as THREE from 'three';
import { useSimStore } from '../state/simStore';
import { getRailSplinePoints, getSleeperTransforms, GAUGE_WIDTH } from '../sim/trackGenerator';
import { Html } from '@react-three/drei';

export function Track() {
  const trackSpline = useSimStore((s) => s.trackSpline);
  const showWireframe = useSimStore((s) => s.showWireframe);
  const showSleepers = useSimStore((s) => s.showSleepers);

  // Instanced mesh refs
  const sleepersRef = useRef<THREE.InstancedMesh>(null!);
  const fastenersRef = useRef<THREE.InstancedMesh>(null!);

  // 1. Generate left and right rail extruded tube geometries
  const { leftRailGeo, rightRailGeo, ballastGeo, kmMarkers } = useMemo(() => {
    const leftPoints = getRailSplinePoints(trackSpline, 'left', 400);
    const rightPoints = getRailSplinePoints(trackSpline, 'right', 400);

    const leftCurve = new THREE.CatmullRomCurve3(leftPoints);
    const rightCurve = new THREE.CatmullRomCurve3(rightPoints);

    // Custom rail head profile shape (I-beam approximation)
    const railShape = new THREE.Shape();
    const w = 0.07; // Rail head width 7cm
    const h = 0.14; // Rail height 14cm
    railShape.moveTo(-w / 2, 0);
    railShape.lineTo(w / 2, 0);
    railShape.lineTo(w / 2, h * 0.2);
    railShape.lineTo(w / 4, h * 0.4);
    railShape.lineTo(w / 4, h * 0.8);
    railShape.lineTo(w / 2, h);
    railShape.lineTo(-w / 2, h);
    railShape.lineTo(-w / 4, h * 0.8);
    railShape.lineTo(-w / 4, h * 0.4);
    railShape.lineTo(-w / 2, h * 0.2);
    railShape.closePath();

    const extrudeSettings: THREE.ExtrudeGeometryOptions = {
      steps: 400,
      bevelEnabled: false,
      extrudePath: leftCurve,
    };

    const leftGeo = new THREE.ExtrudeGeometry(railShape, extrudeSettings);
    const rightGeo = new THREE.ExtrudeGeometry(railShape, { ...extrudeSettings, extrudePath: rightCurve });

    // Ballast bed gravel geometry extruded along central spline
    const ballastShape = new THREE.Shape();
    ballastShape.moveTo(-1.9, -0.4);
    ballastShape.lineTo(-1.3, 0.05);
    ballastShape.lineTo(1.3, 0.05);
    ballastShape.lineTo(1.9, -0.4);
    ballastShape.closePath();

    const ballastExtrude: THREE.ExtrudeGeometryOptions = {
      steps: 300,
      bevelEnabled: false,
      extrudePath: trackSpline,
    };
    const bGeo = new THREE.ExtrudeGeometry(ballastShape, ballastExtrude);

    // Kilometer marker post locations (every 50 meters)
    const totalLen = trackSpline.getLength();
    const markerCount = Math.floor(totalLen / 50);
    const markers = [];

    for (let i = 0; i <= markerCount; i++) {
      const u = (i * 50) / totalLen;
      if (u <= 1.0) {
        const pt = trackSpline.getPointAt(u);
        const tan = trackSpline.getTangentAt(u);
        const normal = new THREE.Vector3(0, 1, 0);
        const side = new THREE.Vector3().crossVectors(tan, normal).normalize();
        
        // Post position offset 2.6m to the right side of track
        const postPos = pt.clone().addScaledVector(side, 2.6);
        markers.push({
          pos: postPos,
          kmText: `KM ${(i * 0.05).toFixed(2)}`,
        });
      }
    }

    return {
      leftRailGeo: leftGeo,
      rightRailGeo: rightGeo,
      ballastGeo: bGeo,
      kmMarkers: markers,
    };
  }, [trackSpline]);

  // Dispose geometries on unmount or update to ensure zero memory leaks
  React.useEffect(() => {
    return () => {
      leftRailGeo.dispose();
      rightRailGeo.dispose();
      ballastGeo.dispose();
    };
  }, [leftRailGeo, rightRailGeo, ballastGeo]);

  // 2. Sleeper & Fastener instanced transforms
  const sleeperTransforms = useMemo(() => {
    return getSleeperTransforms(trackSpline, 0.60); // Sleeper every 60cm
  }, [trackSpline]);

  // 3. Update InstancedMesh matrices
  useLayoutEffect(() => {
    if (!sleepersRef.current || !showSleepers) return;

    const sleeperDummy = new THREE.Object3D();
    const fastenerDummy = new THREE.Object3D();
    let fastenerIndex = 0;

    sleeperTransforms.forEach((st, idx) => {
      // Concrete Sleeper positioning
      sleeperDummy.position.copy(st.position);
      sleeperDummy.rotation.copy(st.rotation);
      sleeperDummy.scale.set(2.4, 0.14, 0.24); // 2.4m wide tie
      sleeperDummy.updateMatrix();
      sleepersRef.current.setMatrixAt(idx, sleeperDummy.matrix);

      // 4 Pandrol fastener clips per sleeper (2 for left rail, 2 for right rail)
      if (fastenersRef.current) {
        const offsets = [-GAUGE_WIDTH / 2 - 0.06, -GAUGE_WIDTH / 2 + 0.06, GAUGE_WIDTH / 2 - 0.06, GAUGE_WIDTH / 2 + 0.06];
        offsets.forEach((offX) => {
          fastenerDummy.position.copy(st.position);
          fastenerDummy.rotation.copy(st.rotation);
          fastenerDummy.translateX(offX);
          fastenerDummy.translateY(0.08);
          fastenerDummy.scale.set(0.05, 0.04, 0.08);
          fastenerDummy.updateMatrix();
          fastenersRef.current.setMatrixAt(fastenerIndex++, fastenerDummy.matrix);
        });
      }
    });

    sleepersRef.current.instanceMatrix.needsUpdate = true;
    if (fastenersRef.current) {
      fastenersRef.current.instanceMatrix.needsUpdate = true;
    }
  }, [sleeperTransforms, showSleepers]);

  return (
    <group name="TrackSystem">
      {/* Ballast Bed Gravel Mesh */}
      <mesh geometry={ballastGeo} receiveShadow castShadow>
        <meshStandardMaterial
          color="#38332c"
          roughness={0.92}
          metalness={0.08}
          wireframe={showWireframe}
        />
      </mesh>

      {/* Left Steel Rail Mesh */}
      <mesh geometry={leftRailGeo} castShadow receiveShadow>
        <meshStandardMaterial
          color="#a8b2c2"
          metalness={0.88}
          roughness={0.22}
          wireframe={showWireframe}
        />
      </mesh>

      {/* Right Steel Rail Mesh */}
      <mesh geometry={rightRailGeo} castShadow receiveShadow>
        <meshStandardMaterial
          color="#a8b2c2"
          metalness={0.88}
          roughness={0.22}
          wireframe={showWireframe}
        />
      </mesh>

      {/* Instanced Concrete Sleepers */}
      {showSleepers && (
        <instancedMesh
          ref={sleepersRef}
          args={[undefined, undefined, sleeperTransforms.length]}
          castShadow
          receiveShadow
        >
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial
            color="#5e6268"
            roughness={0.8}
            metalness={0.15}
            wireframe={showWireframe}
          />
        </instancedMesh>
      )}

      {/* Instanced Metallic Fasteners / Clips */}
      {showSleepers && (
        <instancedMesh
          ref={fastenersRef}
          args={[undefined, undefined, sleeperTransforms.length * 4]}
          castShadow
        >
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial color="#1e293b" metalness={0.9} roughness={0.3} />
        </instancedMesh>
      )}

      {/* Kilometer Distance Markers */}
      {kmMarkers.map((km, idx) => (
        <group key={idx} position={km.pos}>
          {/* Post pole */}
          <mesh position={[0, 0.9, 0]} castShadow>
            <cylinderGeometry args={[0.06, 0.08, 1.8, 12]} />
            <meshStandardMaterial color="#64748b" metalness={0.5} roughness={0.5} />
          </mesh>
          {/* Post sign board */}
          <mesh position={[0, 1.6, 0]} castShadow>
            <boxGeometry args={[0.6, 0.4, 0.08]} />
            <meshStandardMaterial color="#0f172a" />
          </mesh>
          {/* Distance Text HTML */}
          <Html position={[0, 1.6, 0.06]} transform center distanceFactor={15}>
            <div className="px-2 py-1 text-xs font-mono font-bold tracking-wider text-cyan-300 bg-slate-900/90 border border-cyan-500/50 rounded shadow-lg pointer-events-none whitespace-nowrap">
              {km.kmText}
            </div>
          </Html>
        </group>
      ))}
    </group>
  );
}
