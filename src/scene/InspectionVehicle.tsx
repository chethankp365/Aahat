import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useSimStore } from '../state/simStore';
import { getTrackFrameAt, GAUGE_WIDTH } from '../sim/trackGenerator';

export function InspectionVehicle() {
  const vehicleRef = useRef<THREE.Group>(null!);
  const wheelRefs = useRef<THREE.Mesh[]>([]);
  const sideRodLeftRef = useRef<THREE.Group>(null!);
  const sideRodRightRef = useRef<THREE.Group>(null!);
  const smokeGroupRef = useRef<THREE.Group>(null!);

  const trackSpline = useSimStore((s) => s.trackSpline);
  const vehicleProgress = useSimStore((s) => s.vehicleProgress);
  const activeSensors = useSimStore((s) => s.activeSensors);
  const vehicleSpeed = useSimStore((s) => s.vehicleSpeedKmH);

  // Wheel rotation angle state tracking
  const wheelAngleRef = useRef(0);

  // Smoke particles state
  const smokeParticles = useRef<
    { pos: THREE.Vector3; scale: number; opacity: number; speed: number }[]
  >([]);

  // Initialize smoke particles
  if (smokeParticles.current.length === 0) {
    for (let i = 0; i < 16; i++) {
      smokeParticles.current.push({
        pos: new THREE.Vector3(0, 1.95 + i * 0.15, 3.4 - i * 0.1),
        scale: 0.15 + i * 0.04,
        opacity: Math.max(0, 0.7 - i * 0.04),
        speed: 0.4 + Math.random() * 0.3,
      });
    }
  }

  useFrame((_, delta) => {
    if (!vehicleRef.current || !trackSpline) return;

    // Calculate frame position, tangent vector, normal, binormal, and curve banking angle
    const { position, tangent, normal, binormal, bankAngle } = getTrackFrameAt(
      trackSpline,
      vehicleProgress
    );

    // Set position slightly above rail head surface
    const vehiclePos = position.clone().addScaledVector(normal, 0.28);
    vehicleRef.current.position.copy(vehiclePos);

    // Construct right-handed rotation matrix to orient front of vehicle along spline tangent
    const rotMat = new THREE.Matrix4().makeBasis(binormal, normal, tangent);
    const targetQuat = new THREE.Quaternion().setFromRotationMatrix(rotMat);

    // Apply curve banking roll angle along tangent axis
    const bankQuat = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), bankAngle);
    targetQuat.multiply(bankQuat);

    vehicleRef.current.quaternion.slerp(targetQuat, 0.95);

    // Spin wheels and animate side connecting rods according to train speed
    const wheelSpinSpeed = (vehicleSpeed / 3.6) * delta * 4.5;
    wheelAngleRef.current += wheelSpinSpeed;

    wheelRefs.current.forEach((wheel) => {
      if (wheel) {
        wheel.rotation.x = wheelAngleRef.current;
      }
    });

    // Animate side piston rods in circular orbit matching wheel crank pin radius (0.18m)
    const pinRadius = 0.18;
    const rodY = Math.sin(wheelAngleRef.current) * pinRadius;
    const rodZ = Math.cos(wheelAngleRef.current) * pinRadius;

    if (sideRodLeftRef.current) {
      sideRodLeftRef.current.position.set(-0.82, 0.4 + rodY, rodZ);
    }
    if (sideRodRightRef.current) {
      sideRodRightRef.current.position.set(0.82, 0.4 + rodY, rodZ);
    }

    // Animate steam smoke particles rising & drifting backward
    if (smokeGroupRef.current) {
      const children = smokeGroupRef.current.children;
      smokeParticles.current.forEach((particle, idx) => {
        if (vehicleSpeed > 0.5) {
          particle.pos.y += delta * particle.speed * 1.5;
          particle.pos.z -= delta * (vehicleSpeed / 10.0 + 0.5);
          particle.scale += delta * 0.4;
          particle.opacity -= delta * 0.35;

          // Reset particle when it fades out
          if (particle.opacity <= 0 || particle.pos.y > 4.5) {
            particle.pos.set((Math.random() - 0.5) * 0.1, 1.95, 3.4 + (Math.random() - 0.5) * 0.1);
            particle.scale = 0.12 + Math.random() * 0.08;
            particle.opacity = 0.65 + Math.random() * 0.2;
          }
        }

        if (children[idx]) {
          children[idx].position.copy(particle.pos);
          children[idx].scale.setScalar(particle.scale);
          const mat = (children[idx] as THREE.Mesh).material as THREE.MeshStandardMaterial;
          if (mat) {
            mat.opacity = particle.opacity;
          }
        }
      });
    }
  });

  const now = Date.now();

  return (
    <group ref={vehicleRef} name="InspectionVehicle">
      {/* ========================================================================= */}
      {/* 1. LOCOMOTIVE STEAM ENGINE (Front Unit: Z = +0.5 to +4.3)                 */}
      {/* ========================================================================= */}

      {/* Main Royal Blue Cylindrical Boiler Body */}
      <mesh position={[0, 1.1, 2.4]} rotation={[Math.PI / 2, 0, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.62, 0.62, 2.6, 32]} />
        <meshStandardMaterial color="#1e3a8a" metalness={0.65} roughness={0.25} />
      </mesh>

      {/* Decorative Gold Boiler Straps / Bands */}
      {[1.4, 2.2, 3.0].map((z, i) => (
        <mesh key={i} position={[0, 1.1, z]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.63, 0.02, 16, 32]} />
          <meshStandardMaterial color="#fbbf24" metalness={0.9} roughness={0.15} />
        </mesh>
      ))}

      {/* Front Smokebox (Black Cylindrical Cap) */}
      <mesh position={[0, 1.1, 3.75]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <cylinderGeometry args={[0.62, 0.62, 0.3, 32]} />
        <meshStandardMaterial color="#0f172a" metalness={0.8} roughness={0.3} />
      </mesh>

      {/* Front Nose Cone Cap */}
      <mesh position={[0, 1.1, 3.95]} rotation={[-Math.PI / 2, 0, 0]} castShadow>
        <coneGeometry args={[0.62, 0.35, 32]} />
        <meshStandardMaterial color="#0f172a" metalness={0.8} roughness={0.25} />
      </mesh>

      {/* Smokestack / Chimney */}
      <group position={[0, 1.75, 3.4]}>
        <mesh castShadow>
          <cylinderGeometry args={[0.18, 0.14, 0.5, 24]} />
          <meshStandardMaterial color="#0f172a" metalness={0.85} roughness={0.2} />
        </mesh>
        {/* Top Rim of Smokestack */}
        <mesh position={[0, 0.26, 0]}>
          <cylinderGeometry args={[0.22, 0.2, 0.08, 24]} />
          <meshStandardMaterial color="#fbbf24" metalness={0.9} roughness={0.15} />
        </mesh>
      </group>

      {/* Gold Steam / Sand Domes on top of boiler */}
      {[2.0, 2.8].map((z, i) => (
        <group key={i} position={[0, 1.75, z]}>
          <mesh castShadow>
            <cylinderGeometry args={[0.2, 0.22, 0.35, 24]} />
            <meshStandardMaterial color="#fbbf24" metalness={0.9} roughness={0.15} />
          </mesh>
          <mesh position={[0, 0.2, 0]} castShadow>
            <sphereGeometry args={[0.2, 24, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
            <meshStandardMaterial color="#fbbf24" metalness={0.9} roughness={0.15} />
          </mesh>
        </group>
      ))}

      {/* Driver's Cabin (Cab) */}
      <group position={[0, 1.25, 0.5]}>
        {/* Cab Main Walls */}
        <mesh castShadow receiveShadow>
          <boxGeometry args={[1.65, 1.25, 1.2]} />
          <meshStandardMaterial color="#1e3a8a" metalness={0.6} roughness={0.3} />
        </mesh>

        {/* Cab Curved Black Roof */}
        <mesh position={[0, 0.68, 0]} castShadow>
          <boxGeometry args={[1.72, 0.12, 1.28]} />
          <meshStandardMaterial color="#0f172a" metalness={0.7} roughness={0.3} />
        </mesh>

        {/* Gold Roof Accent Stripes */}
        <mesh position={[0, 0.74, 0]}>
          <boxGeometry args={[1.74, 0.03, 0.1]} />
          <meshStandardMaterial color="#fbbf24" metalness={0.9} roughness={0.2} />
        </mesh>

        {/* Cab Side Windows (Left & Right) */}
        {[-0.83, 0.83].map((x, i) => (
          <group key={i} position={[x, 0.15, 0]}>
            {/* Window Frame Trim */}
            <mesh>
              <boxGeometry args={[0.04, 0.45, 0.65]} />
              <meshStandardMaterial color="#fbbf24" metalness={0.9} roughness={0.2} />
            </mesh>
            {/* Glass Pane */}
            <mesh>
              <boxGeometry args={[0.05, 0.38, 0.58]} />
              <meshStandardMaterial color="#93c5fd" transparent opacity={0.6} roughness={0.1} />
            </mesh>
          </group>
        ))}

        {/* Front Cab Window Glass */}
        {[-0.45, 0.45].map((x, i) => (
          <mesh key={i} position={[x, 0.25, 0.61]}>
            <boxGeometry args={[0.35, 0.35, 0.02]} />
            <meshStandardMaterial color="#93c5fd" transparent opacity={0.6} roughness={0.1} />
          </mesh>
        ))}
      </group>

      {/* Heavy Duty Lower Chassis Base & Running Boards */}
      <mesh position={[0, 0.4, 2.1]} castShadow receiveShadow>
        <boxGeometry args={[1.7, 0.2, 4.4]} />
        <meshStandardMaterial color="#0f172a" metalness={0.85} roughness={0.25} />
      </mesh>

      {/* Gold Side Running Board Trim */}
      {[-0.86, 0.86].map((x, i) => (
        <mesh key={i} position={[x, 0.42, 2.1]}>
          <boxGeometry args={[0.04, 0.08, 4.4]} />
          <meshStandardMaterial color="#fbbf24" metalness={0.9} roughness={0.2} />
        </mesh>
      ))}

      {/* Front Cowcatcher / Pilot Bumper */}
      <group position={[0, 0.25, 4.25]}>
        <mesh castShadow>
          <boxGeometry args={[1.65, 0.3, 0.25]} />
          <meshStandardMaterial color="#0f172a" metalness={0.9} />
        </mesh>
        {/* Front Wedge Slats */}
        {[-0.6, -0.3, 0, 0.3, 0.6].map((x, i) => (
          <mesh key={i} position={[x, -0.08, 0.15]} rotation={[0.4, 0, 0]}>
            <boxGeometry args={[0.06, 0.28, 0.12]} />
            <meshStandardMaterial color="#fbbf24" metalness={0.9} roughness={0.2} />
          </mesh>
        ))}
      </group>

      {/* Dual Warm Vintage Lantern Headlights */}
      {[-0.6, 0.6].map((x, i) => (
        <group key={i} position={[x, 0.55, 4.3]}>
          {/* Brass Housing */}
          <mesh rotation={[Math.PI / 2, 0, 0]} castShadow>
            <cylinderGeometry args={[0.14, 0.14, 0.2, 24]} />
            <meshStandardMaterial color="#fbbf24" metalness={0.95} roughness={0.15} />
          </mesh>

          {/* Glowing Front Lens */}
          <mesh position={[0, 0, 0.11]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.12, 0.12, 0.02, 24]} />
            <meshStandardMaterial color="#fef08a" emissive="#fbbf24" emissiveIntensity={2.5} />
          </mesh>

          {/* Forward Spotlight Beam */}
          <spotLight
            position={[0, 0, 0.15]}
            target-position={[0, -0.5, 15]}
            angle={0.5}
            penumbra={0.3}
            intensity={18}
            color="#fef3c7"
            castShadow
          />
        </group>
      ))}

      {/* High Central Nose Headlight */}
      <group position={[0, 1.1, 4.15]}>
        <mesh rotation={[Math.PI / 2, 0, 0]} castShadow>
          <cylinderGeometry args={[0.16, 0.16, 0.18, 24]} />
          <meshStandardMaterial color="#fbbf24" metalness={0.95} roughness={0.15} />
        </mesh>
        <mesh position={[0, 0, 0.1]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.14, 0.14, 0.02, 24]} />
          <meshStandardMaterial color="#ffffff" emissive="#fef08a" emissiveIntensity={3.0} />
        </mesh>
        <spotLight
          position={[0, 0, 0.12]}
          target-position={[0, -0.2, 20]}
          angle={0.4}
          penumbra={0.2}
          intensity={24}
          color="#ffffff"
          castShadow
        />
      </group>

      {/* ========================================================================= */}
      {/* 2. DRIVING WHEELS & ANIMATED PISTON SIDE RODS                             */}
      {/* ========================================================================= */}

      {/* 6 Large Locomotive Driving Wheels (3 on each side) */}
      {[-GAUGE_WIDTH / 2, GAUGE_WIDTH / 2].map((xSide, xIdx) =>
        [0.7, 2.0, 3.3].map((zPos, zIdx) => {
          const idx = xIdx * 3 + zIdx;
          return (
            <group key={idx} position={[xSide, 0.35, zPos]}>
              {/* Outer Steel Rim Wheel */}
              <mesh
                ref={(el) => {
                  if (el) wheelRefs.current[idx] = el;
                }}
                rotation={[0, 0, Math.PI / 2]}
                castShadow
              >
                <cylinderGeometry args={[0.35, 0.35, 0.12, 32]} />
                <meshStandardMaterial color="#1e293b" metalness={0.9} roughness={0.2} />
              </mesh>

              {/* Gold Counterweight / Hub */}
              <mesh position={[xSide < 0 ? -0.06 : 0.06, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
                <cylinderGeometry args={[0.18, 0.18, 0.04, 24]} />
                <meshStandardMaterial color="#fbbf24" metalness={0.95} roughness={0.15} />
              </mesh>

              {/* Steel Flange Rim */}
              <mesh position={[xSide < 0 ? 0.06 : -0.06, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
                <cylinderGeometry args={[0.4, 0.4, 0.02, 32]} />
                <meshStandardMaterial color="#475569" metalness={0.95} roughness={0.1} />
              </mesh>
            </group>
          );
        })
      )}

      {/* Small Front Bogie Guide Wheels (4 Wheels) */}
      {[-GAUGE_WIDTH / 2, GAUGE_WIDTH / 2].map((xSide, xIdx) =>
        [3.85, 4.25].map((zPos, zIdx) => {
          const idx = 6 + xIdx * 2 + zIdx;
          return (
            <group key={idx} position={[xSide, 0.22, zPos]}>
              <mesh
                ref={(el) => {
                  if (el) wheelRefs.current[idx] = el;
                }}
                rotation={[0, 0, Math.PI / 2]}
                castShadow
              >
                <cylinderGeometry args={[0.2, 0.2, 0.1, 24]} />
                <meshStandardMaterial color="#334155" metalness={0.9} roughness={0.2} />
              </mesh>
            </group>
          );
        })
      )}

      {/* Left Animated Side Connecting Rod */}
      <group ref={sideRodLeftRef} position={[-0.82, 0.35, 2.0]}>
        <mesh position={[0, 0, 0]} castShadow>
          <boxGeometry args={[0.04, 0.08, 2.8]} />
          <meshStandardMaterial color="#e2e8f0" metalness={0.98} roughness={0.08} />
        </mesh>
      </group>

      {/* Right Animated Side Connecting Rod */}
      <group ref={sideRodRightRef} position={[0.82, 0.35, 2.0]}>
        <mesh position={[0, 0, 0]} castShadow>
          <boxGeometry args={[0.04, 0.08, 2.8]} />
          <meshStandardMaterial color="#e2e8f0" metalness={0.98} roughness={0.08} />
        </mesh>
      </group>

      {/* Animated Chimney Steam Smoke Particles */}
      <group ref={smokeGroupRef}>
        {smokeParticles.current.map((_, i) => (
          <mesh key={i}>
            <sphereGeometry args={[1, 16, 16]} />
            <meshStandardMaterial
              color="#f8fafc"
              transparent
              opacity={0.5}
              roughness={1.0}
              depthWrite={false}
            />
          </mesh>
        ))}
      </group>

      {/* ========================================================================= */}
      {/* 3. COAL TENDER CAR (Middle Unit: Z = -0.5 to -2.3)                        */}
      {/* ========================================================================= */}
      <group position={[0, 0, -1.4]}>
        {/* Tender Body Frame */}
        <mesh position={[0, 1.0, 0]} castShadow receiveShadow>
          <boxGeometry args={[1.65, 0.9, 1.7]} />
          <meshStandardMaterial color="#1e3a8a" metalness={0.65} roughness={0.25} />
        </mesh>

        {/* Gold Side Trim Line */}
        {[-0.84, 0.84].map((x, i) => (
          <mesh key={i} position={[x, 1.25, 0]}>
            <boxGeometry args={[0.03, 0.06, 1.7]} />
            <meshStandardMaterial color="#fbbf24" metalness={0.9} roughness={0.15} />
          </mesh>
        ))}

        {/* Coal Pile Mound inside Tender */}
        <mesh position={[0, 1.48, 0]} castShadow>
          <boxGeometry args={[1.45, 0.22, 1.5]} />
          <meshStandardMaterial color="#0f172a" roughness={0.95} metalness={0.1} />
        </mesh>

        {/* Tender Wheel Bogies */}
        {[-GAUGE_WIDTH / 2, GAUGE_WIDTH / 2].map((xSide, xIdx) =>
          [-0.5, 0.5].map((zPos, zIdx) => {
            const idx = 10 + xIdx * 2 + zIdx;
            return (
              <group key={idx} position={[xSide, 0.25, zPos]}>
                <mesh
                  ref={(el) => {
                    if (el) wheelRefs.current[idx] = el;
                  }}
                  rotation={[0, 0, Math.PI / 2]}
                  castShadow
                >
                  <cylinderGeometry args={[0.24, 0.24, 0.1, 24]} />
                  <meshStandardMaterial color="#334155" metalness={0.9} roughness={0.2} />
                </mesh>
              </group>
            );
          })
        )}
      </group>

      {/* ========================================================================= */}
      {/* 4. PASSENGER COACH CAR (Rear Unit: Z = -2.6 to -6.8)                     */}
      {/* ========================================================================= */}
      <group position={[0, 0, -4.7]}>
        {/* Passenger Coach Main Body */}
        <mesh position={[0, 1.25, 0]} castShadow receiveShadow>
          <boxGeometry args={[1.68, 1.35, 4.1]} />
          <meshStandardMaterial color="#1e3a8a" metalness={0.6} roughness={0.3} />
        </mesh>

        {/* Pearl White Vaulted Roof */}
        <mesh position={[0, 1.96, 0]} castShadow>
          <boxGeometry args={[1.72, 0.14, 4.16]} />
          <meshStandardMaterial color="#f8fafc" roughness={0.3} metalness={0.2} />
        </mesh>

        {/* Gold Waistline Stripe */}
        {[-0.85, 0.85].map((x, i) => (
          <mesh key={i} position={[x, 1.3, 0]}>
            <boxGeometry args={[0.03, 0.06, 4.1]} />
            <meshStandardMaterial color="#fbbf24" metalness={0.9} roughness={0.15} />
          </mesh>
        ))}

        {/* Illuminated Warm Yellow Side Windows (5 Windows per side) */}
        {[-0.85, 0.85].map((xSide, sIdx) =>
          [-1.5, -0.75, 0, 0.75, 1.5].map((zPos, wIdx) => (
            <group key={`${sIdx}-${wIdx}`} position={[xSide, 1.45, zPos]}>
              {/* Window Frame */}
              <mesh>
                <boxGeometry args={[0.04, 0.42, 0.52]} />
                <meshStandardMaterial color="#fbbf24" metalness={0.9} roughness={0.2} />
              </mesh>
              {/* Illuminated Glass Pane */}
              <mesh>
                <boxGeometry args={[0.05, 0.36, 0.46]} />
                <meshStandardMaterial
                  color="#fef08a"
                  emissive="#f59e0b"
                  emissiveIntensity={1.8}
                  transparent
                  opacity={0.85}
                />
              </mesh>
            </group>
          ))
        )}

        {/* Coach Wheel Bogies (Front & Rear Bogie Sets) */}
        {[-GAUGE_WIDTH / 2, GAUGE_WIDTH / 2].map((xSide, xIdx) =>
          [-1.4, -0.8, 0.8, 1.4].map((zPos, zIdx) => {
            const idx = 14 + xIdx * 4 + zIdx;
            return (
              <group key={idx} position={[xSide, 0.25, zPos]}>
                <mesh
                  ref={(el) => {
                    if (el) wheelRefs.current[idx] = el;
                  }}
                  rotation={[0, 0, Math.PI / 2]}
                  castShadow
                >
                  <cylinderGeometry args={[0.24, 0.24, 0.1, 24]} />
                  <meshStandardMaterial color="#334155" metalness={0.9} roughness={0.2} />
                </mesh>
              </group>
            );
          })
        )}
      </group>

      {/* ========================================================================= */}
      {/* 5. MOUNTED DIGITAL TWIN SAFETY SENSORS                                    */}
      {/* ========================================================================= */}

      {/* 1. OPTICAL STEREO COMPUTER VISION CAMERA MODULE (Front Bumper Bracket) */}
      <group position={[0, 0.8, 4.25]}>
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
              emissiveIntensity={activeSensors.optical ? 2.2 + Math.sin(now / 200) * 0.5 : 0}
            />
          </mesh>
        ))}
      </group>

      {/* 2. ULTRASONIC ACOUSTIC MICROPHONE ARRAY MODULE (Side Bogie Frame) */}
      <group position={[-0.88, 0.55, 2.5]}>
        <mesh castShadow>
          <boxGeometry args={[0.22, 0.28, 0.22]} />
          <meshStandardMaterial color="#1e1b4b" metalness={0.7} />
        </mesh>
        {/* Glowing Acoustic Ring Sensor */}
        <mesh position={[-0.12, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
          <torusGeometry args={[0.09, 0.02, 16, 32]} />
          <meshStandardMaterial
            color="#a855f7"
            emissive={activeSensors.acoustic ? '#a855f7' : '#000000'}
            emissiveIntensity={activeSensors.acoustic ? 2.5 + Math.sin(now / 150) * 0.8 : 0}
          />
        </mesh>
      </group>

      {/* 3. ACCELEROMETER / IMU SENSOR BOX (Driver Cab Wall) */}
      <group position={[0.88, 0.95, 0.5]}>
        <mesh castShadow>
          <boxGeometry args={[0.22, 0.25, 0.25]} />
          <meshStandardMaterial color="#064e3b" roughness={0.4} />
        </mesh>
        {/* Pulsing Green Status LED */}
        <mesh position={[0.12, 0, 0]}>
          <sphereGeometry args={[0.05, 16, 16]} />
          <meshStandardMaterial
            color="#22c55e"
            emissive={activeSensors.accelerometer ? '#22c55e' : '#000000'}
            emissiveIntensity={activeSensors.accelerometer ? 2.5 + Math.sin(now / 120) * 0.8 : 0}
          />
        </mesh>
      </group>

      {/* 4. GPS / ROTATING LIDAR SCANNER POD (Driver Cab Roof Dome) */}
      <group position={[0, 2.05, 0.5]}>
        <mesh castShadow>
          <cylinderGeometry args={[0.04, 0.04, 0.25, 12]} />
          <meshStandardMaterial color="#475569" metalness={0.8} />
        </mesh>
        <mesh position={[0, 0.18, 0]} castShadow>
          <cylinderGeometry args={[0.22, 0.22, 0.16, 24]} />
          <meshStandardMaterial color="#0284c7" metalness={0.6} roughness={0.2} />
        </mesh>
        {/* Pulsing LiDAR Beam Ring */}
        <mesh position={[0, 0.27, 0]}>
          <cylinderGeometry args={[0.23, 0.23, 0.03, 24]} />
          <meshStandardMaterial
            color="#06b6d4"
            emissive={activeSensors.laser ? '#06b6d4' : '#000000'}
            emissiveIntensity={activeSensors.laser ? 2.8 + Math.sin(now / 100) * 1.0 : 0}
          />
        </mesh>
      </group>

      {/* Underbody Laser Rail Scanner Emitter Sheet */}
      <mesh position={[0, 0.15, 3.2]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.08, 0.08, 1.4, 16]} />
        <meshStandardMaterial
          color="#10b981"
          emissive="#10b981"
          emissiveIntensity={activeSensors.laser ? 2.0 : 0.1}
        />
      </mesh>
    </group>
  );
}
