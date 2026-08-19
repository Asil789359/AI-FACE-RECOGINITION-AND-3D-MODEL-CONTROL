import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export default function AvatarHead({ poseData, activeLighting }) {
  const headGroupRef = useRef();
  const leftEyeRef = useRef();
  const rightEyeRef = useRef();
  const jawRef = useRef();
  const visorGlowRef = useRef();

  // Target rotation quaternions & angles for smooth interpolation (LERP)
  const targetRotation = useRef(new THREE.Euler(0, 0, 0, 'YXZ'));
  const currentRotation = useRef(new THREE.Euler(0, 0, 0, 'YXZ'));

  useFrame((state, delta) => {
    if (!headGroupRef.current) return;

    // Convert degrees to radians (invert yaw/roll for natural mirror feel)
    const pitchRad = ((poseData?.pitch || 0) * Math.PI) / 180;
    const yawRad = ((-poseData?.yaw || 0) * Math.PI) / 180;
    const rollRad = ((-poseData?.roll || 0) * Math.PI) / 180;

    targetRotation.current.set(pitchRad, yawRad, rollRad);

    // Smooth LERP interpolation for 60 FPS fluid motion
    headGroupRef.current.rotation.x = THREE.MathUtils.lerp(headGroupRef.current.rotation.x, targetRotation.current.x, 0.15);
    headGroupRef.current.rotation.y = THREE.MathUtils.lerp(headGroupRef.current.rotation.y, targetRotation.current.y, 0.15);
    headGroupRef.current.rotation.z = THREE.MathUtils.lerp(headGroupRef.current.rotation.z, targetRotation.current.z, 0.15);

    // Head Translation (slight position follow)
    const targetX = (poseData?.transX || 0) * 0.8;
    const targetY = (poseData?.transY || 0) * 0.8;
    headGroupRef.current.position.x = THREE.MathUtils.lerp(headGroupRef.current.position.x, targetX, 0.1);
    headGroupRef.current.position.y = THREE.MathUtils.lerp(headGroupRef.current.position.y, targetY, 0.1);

    // Reactive Jaw opening (MAR)
    if (jawRef.current) {
      const mar = poseData?.mar?.mar || 0;
      const targetJawAngle = Math.min(0.4, mar * 0.6);
      jawRef.current.rotation.x = THREE.MathUtils.lerp(jawRef.current.rotation.x, targetJawAngle, 0.2);
    }

    // Reactive Eyes (Blink / Wink via EAR)
    const leftEAR = poseData?.ear?.leftEAR ?? 0.3;
    const rightEAR = poseData?.ear?.rightEAR ?? 0.3;
    
    if (leftEyeRef.current) {
      const targetLeftScale = Math.max(0.1, leftEAR * 3.5);
      leftEyeRef.current.scale.y = THREE.MathUtils.lerp(leftEyeRef.current.scale.y, targetLeftScale, 0.3);
    }
    if (rightEyeRef.current) {
      const targetRightScale = Math.max(0.1, rightEAR * 3.5);
      rightEyeRef.current.scale.y = THREE.MathUtils.lerp(rightEyeRef.current.scale.y, targetRightScale, 0.3);
    }

    // Visor Pulse intensity on smile or gesture
    if (visorGlowRef.current) {
      const isSmiling = poseData?.mar?.isSmiling;
      const targetEmissive = isSmiling ? 2.5 : 0.8;
      visorGlowRef.current.emissiveIntensity = THREE.MathUtils.lerp(visorGlowRef.current.emissiveIntensity, targetEmissive, 0.1);
    }
  });

  return (
    <group ref={headGroupRef} position={[0, 0, 0]}>
      {/* 1. Main Metallic Skull Helmet */}
      <mesh position={[0, 0.3, 0]}>
        <sphereGeometry args={[1.1, 32, 32]} />
        <meshStandardMaterial 
          color="#0f172a" 
          metalness={0.9} 
          roughness={0.2} 
          wireframe={false} 
        />
      </mesh>

      {/* Skull Crown Detail Crest */}
      <mesh position={[0, 1.3, -0.1]} rotation={[0.2, 0, 0]}>
        <boxGeometry args={[0.3, 0.4, 1.2]} />
        <meshStandardMaterial color="#00f3ff" metalness={0.8} roughness={0.1} />
      </mesh>

      {/* Cheek / Temple Armor Plates */}
      <mesh position={[-1.0, 0.2, 0.2]} rotation={[0, 0.4, -0.2]}>
        <boxGeometry args={[0.2, 0.9, 0.8]} />
        <meshStandardMaterial color="#1e293b" metalness={0.9} roughness={0.3} />
      </mesh>
      <mesh position={[1.0, 0.2, 0.2]} rotation={[0, -0.4, 0.2]}>
        <boxGeometry args={[0.2, 0.9, 0.8]} />
        <meshStandardMaterial color="#1e293b" metalness={0.9} roughness={0.3} />
      </mesh>

      {/* 2. Futuristic Cyber Visor Plate */}
      <mesh position={[0, 0.45, 0.85]} rotation={[0.1, 0, 0]}>
        <boxGeometry args={[1.5, 0.45, 0.4]} />
        <meshStandardMaterial 
          ref={visorGlowRef}
          color="#000000" 
          emissive="#00f3ff" 
          emissiveIntensity={0.8}
          roughness={0.1}
          metalness={1.0}
        />
      </mesh>

      {/* 3. Glowing LED Eyes (Interactive with EAR / Blinking) */}
      <group position={[0, 0.45, 1.06]}>
        {/* Left LED Eye */}
        <mesh ref={leftEyeRef} position={[-0.45, 0, 0]}>
          <boxGeometry args={[0.35, 0.15, 0.05]} />
          <meshBasicMaterial color="#00f3ff" />
        </mesh>
        {/* Right LED Eye */}
        <mesh ref={rightEyeRef} position={[0.45, 0, 0]}>
          <boxGeometry args={[0.35, 0.15, 0.05]} />
          <meshBasicMaterial color="#00f3ff" />
        </mesh>
      </group>

      {/* 4. Interactive Jaw (Controlled by MAR / Mouth Opening) */}
      <group ref={jawRef} position={[0, -0.2, 0.4]}>
        <mesh position={[0, -0.4, 0.2]}>
          <boxGeometry args={[1.1, 0.5, 0.9]} />
          <meshStandardMaterial color="#1e293b" metalness={0.95} roughness={0.2} />
        </mesh>
        {/* Cyber Teeth / Vent Grill */}
        <mesh position={[0, -0.22, 0.62]}>
          <boxGeometry args={[0.7, 0.1, 0.05]} />
          <meshBasicMaterial color="#ff0055" />
        </mesh>
      </group>

      {/* Ear Energy Nodes */}
      <mesh position={[-1.15, 0.3, 0]}>
        <cylinderGeometry args={[0.2, 0.2, 0.2, 16]} rotation={[0, 0, Math.PI / 2]} />
        <meshStandardMaterial color="#ff0055" emissive="#ff0055" emissiveIntensity={1.5} />
      </mesh>
      <mesh position={[1.15, 0.3, 0]}>
        <cylinderGeometry args={[0.2, 0.2, 0.2, 16]} rotation={[0, 0, Math.PI / 2]} />
        <meshStandardMaterial color="#ff0055" emissive="#ff0055" emissiveIntensity={1.5} />
      </mesh>
    </group>
  );
}
