import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export default function SpatialHologram({ poseData }) {
  const groupRef = useRef();
  const innerCoreRef = useRef();
  const ring1Ref = useRef();
  const ring2Ref = useRef();
  const ring3Ref = useRef();

  useFrame((state, delta) => {
    if (!groupRef.current) return;

    const pitch = poseData?.pitch || 0;
    const yaw = poseData?.yaw || 0;
    const roll = poseData?.roll || 0;
    const mar = poseData?.mar?.mar || 0;
    const isBlinking = poseData?.ear?.isBlinking;

    // Head orientation tracking
    const targetPitch = (pitch * Math.PI) / 180;
    const targetYaw = (-yaw * Math.PI) / 180;
    const targetRoll = (-roll * Math.PI) / 180;

    groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, targetPitch, 0.1);
    groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, targetYaw, 0.1);
    groupRef.current.rotation.z = THREE.MathUtils.lerp(groupRef.current.rotation.z, targetRoll, 0.1);

    // Continuous ambient orbital spins
    if (innerCoreRef.current) {
      innerCoreRef.current.rotation.x += delta * 0.8;
      innerCoreRef.current.rotation.y += delta * 1.2;
      const coreScale = 1 + mar * 0.8;
      innerCoreRef.current.scale.set(coreScale, coreScale, coreScale);
    }

    if (ring1Ref.current) ring1Ref.current.rotation.z += delta * 0.9;
    if (ring2Ref.current) ring2Ref.current.rotation.x += delta * 1.4;
    if (ring3Ref.current) ring3Ref.current.rotation.y += delta * 0.7;
  });

  return (
    <group ref={groupRef} position={[0, 0, 0]}>
      {/* 1. Inner Holographic Crystal Core */}
      <mesh ref={innerCoreRef}>
        <icosahedronGeometry args={[1.1, 1]} />
        <meshStandardMaterial 
          color="#00f3ff" 
          emissive="#00f3ff" 
          emissiveIntensity={1.2} 
          wireframe={true} 
        />
      </mesh>

      {/* 2. Concentric Energy Rings */}
      <mesh ref={ring1Ref}>
        <torusGeometry args={[1.8, 0.04, 16, 100]} />
        <meshBasicMaterial color="#ff0055" />
      </mesh>

      <mesh ref={ring2Ref} rotation={[Math.PI / 3, 0, 0]}>
        <torusGeometry args={[2.2, 0.04, 16, 100]} />
        <meshBasicMaterial color="#00f3ff" />
      </mesh>

      <mesh ref={ring3Ref} rotation={[0, Math.PI / 4, 0]}>
        <torusGeometry args={[2.6, 0.04, 16, 100]} />
        <meshBasicMaterial color="#8a2be2" />
      </mesh>

      {/* 3. Orbiting Data Nodes */}
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <mesh 
          key={i} 
          position={[
            Math.sin((i * Math.PI) / 3) * 2.2,
            Math.cos((i * Math.PI) / 3) * 2.2,
            0
          ]}
        >
          <boxGeometry args={[0.15, 0.15, 0.15]} />
          <meshBasicMaterial color="#00ff88" />
        </mesh>
      ))}
    </group>
  );
}
