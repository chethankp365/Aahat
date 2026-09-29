import * as THREE from 'three';

// 3D Control points for a ~450m curved and undulating rail track
const CONTROL_POINTS = [
  new THREE.Vector3(0, 0, 0),
  new THREE.Vector3(20, 0.4, -40),
  new THREE.Vector3(60, 2.5, -90),     // Elevation hill
  new THREE.Vector3(120, 4.0, -160),   // Peak & curve right
  new THREE.Vector3(180, 2.2, -230),   // S-curve transition
  new THREE.Vector3(220, 0.8, -290),   // Curve left
  new THREE.Vector3(280, 0.2, -350),   // Flat section
  new THREE.Vector3(340, 1.5, -410),   // Slight elevation curve
  new THREE.Vector3(400, 0.0, -470),   // Terminal straight
];

export const GAUGE_WIDTH = 1.435; // Standard gauge 1435mm (in meters)

export function getTrackSpline(): THREE.CatmullRomCurve3 {
  const curve = new THREE.CatmullRomCurve3(CONTROL_POINTS, false, 'centripetal', 0.5);
  return curve;
}

export function getTrackLength(spline: THREE.CatmullRomCurve3): number {
  return spline.getLength();
}

/**
 * Returns frame orientation (position, tangent, normal, binormal, banking angle) at progress u (0 to 1).
 */
export function getTrackFrameAt(spline: THREE.CatmullRomCurve3, u: number) {
  const position = spline.getPointAt(u);
  const tangent = spline.getTangentAt(u).normalize();

  // Compute reference up vector, accounting for curve banking
  const up = new THREE.Vector3(0, 1, 0);

  // Compute curvature for Banking calculation
  const delta = 0.002;
  const uPrev = Math.max(0, u - delta);
  const uNext = Math.min(1, u + delta);
  const tanPrev = spline.getTangentAt(uPrev);
  const tanNext = spline.getTangentAt(uNext);
  const curvatureVec = tanNext.clone().sub(tanPrev).divideScalar(delta * 2);
  
  // Banking angle proportional to lateral curvature
  const sideVec = new THREE.Vector3().crossVectors(tangent, up).normalize();
  const lateralCurvature = curvatureVec.dot(sideVec);
  const bankAngle = Math.max(-0.15, Math.min(0.15, lateralCurvature * 0.4)); // radians

  // Apply bank angle rotation to binormal & normal
  const normal = up.clone().applyAxisAngle(tangent, bankAngle).normalize();
  const binormal = new THREE.Vector3().crossVectors(tangent, normal).normalize();

  return {
    position,
    tangent,
    normal,
    binormal,
    bankAngle,
  };
}

/**
 * Computes offset rail splines for Left and Right rail heads
 */
export function getRailSplinePoints(spline: THREE.CatmullRomCurve3, side: 'left' | 'right', samples = 300): THREE.Vector3[] {
  const points: THREE.Vector3[] = [];
  const offsetDistance = (side === 'left' ? -1 : 1) * (GAUGE_WIDTH / 2);

  for (let i = 0; i <= samples; i++) {
    const u = i / samples;
    const { position, binormal, normal } = getTrackFrameAt(spline, u);
    
    // Rail position elevated slightly above ballast ground
    const railPos = position.clone()
      .addScaledVector(binormal, offsetDistance)
      .addScaledVector(normal, 0.18); // Rail height offset

    points.push(railPos);
  }

  return points;
}

export interface SleeperTransform {
  position: THREE.Vector3;
  rotation: THREE.Euler;
  progress: number;
  distanceKm: number;
}

/**
 * Computes matrices for instancing 700+ sleepers along the spline
 */
export function getSleeperTransforms(spline: THREE.CatmullRomCurve3, sleeperSpacingMeters = 0.65): SleeperTransform[] {
  const totalLen = spline.getLength();
  const count = Math.floor(totalLen / sleeperSpacingMeters);
  const sleepers: SleeperTransform[] = [];

  const matrixDummy = new THREE.Matrix4();
  const rotDummy = new THREE.Euler();
  const quatDummy = new THREE.Quaternion();

  for (let i = 0; i < count; i++) {
    const u = i / count;
    const { position, tangent, normal, binormal } = getTrackFrameAt(spline, u);

    // Build rotation matrix from binormal (X), normal (Y), tangent (Z)
    const rotMat = new THREE.Matrix4().makeBasis(binormal, normal, tangent);
    quatDummy.setFromRotationMatrix(rotMat);
    rotDummy.setFromQuaternion(quatDummy);

    // Concrete sleeper base position (resting on ballast)
    const sleeperPos = position.clone().addScaledVector(normal, 0.06);

    sleepers.push({
      position: sleeperPos,
      rotation: rotDummy.clone(),
      progress: u,
      distanceKm: (u * totalLen) / 1000,
    });
  }

  return sleepers;
}
