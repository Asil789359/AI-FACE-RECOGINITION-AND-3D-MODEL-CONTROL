import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export default function JetSimulator({ poseData }) {
  const jetGroupRef = useRef();
  const leftWingRef = useRef();
  const rightWingRef = useRef();
  const thrusterFlameRef = useRef();
  const tunnelGridRef = useRef();

  useFrame((state, delta) => {
    if (!jetGroupRef.current) return;

    // Convert Head Pitch, Yaw, Roll to Jet Steering
    const pitch = poseData?.pitch || 0;
    const yaw = poseData?.yaw || 0;
    const roll = poseData?.roll || 0;
    const isNitro = poseData?.mar?.isOpen || poseData?.mar?.isSmiling;

    // Target Jet Orientations
    const targetPitchRad = (pitch * Math.PI) / 180 * 0.7;
    const targetYawRad = (-yaw * Math.PI) / 180 * 0.6;
    const targetRollRad = (-roll * Math.PI) / 180 * 1.2;

    // Target Positions in Flight Corridor
    const targetX = -yaw * 0.08;
    const targetY = pitch * 0.06;

    // Smooth LERP motion
    jetGroupRef.current.rotation.x = THREE.MathUtils.lerp(jetGroupRef.current.rotation.x, targetPitchRad, 0.12);
    jetGroupRef.current.rotation.y = THREE.MathUtils.lerp(jetGroupRef.current.rotation.y, targetYawRad, 0.12);
    jetGroupRef.current.rotation.z = THREE.MathUtils.lerp(jetGroupRef.current.rotation.z, targetRollRad, 0.15);

    jetGroupRef.current.position.x = THREE.MathUtils.lerp(jetGroupRef.current.position.x, targetX, 0.1);
    jetGroupRef.current.position.y = THREE.MathUtils.lerp(jetGroupRef.current.position.y, targetY, 0.1);

    // Infinite Moving Grid Effect
    if (tunnelGridRef.current) {
      const speed = isNitro ? 18.0 : 6.0;
      tunnelGridRef.current.position.z = (tunnelGridRef.current.position.z + speed * delta) % 10;
    }

    // Nitro Thruster Flame Glow
    if (thrusterFlameRef.current) {
      const targetScaleZ = isNitro ? 2.8 : 1.0;
      thrusterFlameRef.current.scale.z = THREE.MathUtils.lerp(thrusterFlameRef.current.scale.z, targetScaleZ, 0.2);
    }
  });

  return (
    <group>
      {/* 3D Fighter Jet Aircraft */}
      <group ref={jetGroupRef} position={[0, 0, 0]}>
        {/* Main Sleek Fuselage */}
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <coneGeometry args={[0.5, 3.2, 16]} />
          <meshStandardMaterial color="#0f172a" metalness={0.9} roughness={0.15} />
        </mesh>

        {/* Cockpit Canopy */}
        <mesh position={[0, 0.25, -0.2]} rotation={[Math.PI / 2.5, 0, 0]}>
          <capsuleGeometry args={[0.25, 0.8, 8, 16]} />
          <meshStandardMaterial color="#00f3ff" emissive="#00f3ff" emissiveIntensity={0.6} roughness={0.1} />
        </mesh>

        {/* Swept Wings */}
        <group ref={leftWingRef} position={[-1.2, 0, 0.3]}>
          <mesh rotation={[0, -0.4, 0]}>
            <boxGeometry args={[1.8, 0.06, 0.9]} />
            <meshStandardMaterial color="#1e293b" metalness={0.8} roughness={0.2} />
          </mesh>
          {/* Wingtip Weapon Light */}
          <mesh position={[-0.9, 0, -0.4]}>
            <boxGeometry args={[0.08, 0.12, 0.4]} />
            <meshBasicMaterial color="#00f3ff" />
          </mesh>
        </group>

        <group ref={rightWingRef} position={[1.2, 0, 0.3]}>
          <mesh rotation={[0, 0.4, 0]}>
            <boxGeometry args={[1.8, 0.06, 0.9]} />
            <meshStandardMaterial color="#1e293b" metalness={0.8} roughness={0.2} />
          </mesh>
          {/* Wingtip Weapon Light */}
          <mesh position={[0.9, 0, -0.4]}>
            <boxGeometry args={[0.08, 0.12, 0.4]} />
            <meshBasicMaterial color="#00f3ff" />
          </mesh>
        </group>

        {/* Twin Tail Stabilizers */}
        <mesh position={[-0.45, 0.4, 1.1]} rotation={[0, 0, -0.3]}>
          <boxGeometry args={[0.08, 0.7, 0.6]} />
          <meshStandardMaterial color="#334155" metalness={0.9} />
        </mesh>
        <mesh position={[0.45, 0.4, 1.1]} rotation={[0, 0, 0.3]}>
          <boxGeometry args={[0.08, 0.7, 0.6]} />
          <meshStandardMaterial color="#334155" metalness={0.9} />
        </mesh>

        {/* Rear Thruster Engine Glow */}
        <mesh position={[0, 0, 1.6]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.3, 0.35, 0.3, 16]} />
          <meshStandardMaterial color="#000000" metalness={1.0} />
        </mesh>
        
        {/* Plasma Thruster Flame (Extends during Nitro Boost) */}
        <mesh ref={thrusterFlameRef} position={[0, 0, 2.2]} rotation={[-Math.PI / 2, 0, 0]}>
          <coneGeometry args={[0.28, 1.2, 16]} />
          <meshBasicMaterial color="#ff0055" />
        </mesh>
      </group>

      {/* Infinite Sci-Fi Tunnel Floor Grid */}
      <group ref={tunnelGridRef} position={[0, -2.5, 0]}>
        <gridHelper args={[100, 40, '#00f3ff', '#1e293b']} />
      </group>
    </group>
  );
}
