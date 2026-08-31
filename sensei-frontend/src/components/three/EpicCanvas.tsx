'use client';

import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, Stars, Sparkles, PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';

function FloatingBook() {
  const meshRef = useRef<THREE.Group>(null);
  
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.3;
      meshRef.current.position.y = Math.sin(state.clock.elapsedTime * 0.8) * 0.2;
    }
  });

  return (
    <Float speed={2} rotationIntensity={0.5} floatIntensity={1.5}>
      <group ref={meshRef}>
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[2.4, 3, 0.3]} />
          <meshStandardMaterial color="#0B0C10" roughness={0.2} metalness={0.9} />
        </mesh>
        <mesh position={[0, 0, 0.16]}>
          <boxGeometry args={[2.2, 2.8, 0.02]} />
          <meshStandardMaterial color="#00E5FF" emissive="#00E5FF" emissiveIntensity={0.4} roughness={0.1} metalness={0.8} />
        </mesh>
        {[...Array(8)].map((_, i) => (
          <mesh key={i} position={[-0.05, -1.2 + i * 0.35, 0]}>
            <boxGeometry args={[2.3, 0.02, 0.28]} />
            <meshStandardMaterial color="#D500F9" emissive="#D500F9" emissiveIntensity={0.2} />
          </mesh>
        ))}
        <mesh position={[-1.2, 0, 0]}>
          <boxGeometry args={[0.05, 3, 0.35]} />
          <meshStandardMaterial color="#FF3D00" metalness={0.5} />
        </mesh>
      </group>
    </Float>
  );
}

function FireParticles() {
  return (
    <Sparkles count={400} scale={15} size={6} speed={0.4} opacity={0.6} color="#FF6D00" />
  );
}

function MagicParticles() {
  return (
    <Sparkles count={300} scale={20} size={4} speed={0.2} opacity={0.4} color="#00E5FF" />
  );
}

function CameraRig() {
  useFrame((state) => {
    state.camera.position.x = THREE.MathUtils.lerp(state.camera.position.x, (state.mouse.x * 2), 0.05);
    state.camera.position.y = THREE.MathUtils.lerp(state.camera.position.y, (state.mouse.y * 2), 0.05);
    state.camera.lookAt(0, 0, 0);
  });
  return null;
}

export default function EpicCanvas() {
  return (
    <div className="absolute inset-0 w-full h-full bg-gradient-to-b from-[#0B0C10] via-[#1A0B2E] to-[#040C18]">
      <Canvas gl={{ antialias: true, alpha: true }}>
        <PerspectiveCamera makeDefault position={[0, 0, 10]} fov={60} />
        <CameraRig />
        
        <ambientLight intensity={0.2} />
        <directionalLight position={[5, 10, 5]} intensity={1.5} color="#FF3D00" />
        <pointLight position={[-5, -5, -5]} intensity={2} color="#00E5FF" />
        <pointLight position={[0, 5, -10]} intensity={1.5} color="#D500F9" />
        
        <FloatingBook />
        <FireParticles />
        <MagicParticles />
        
        <Stars radius={100} depth={50} count={5000} factor={4} saturation={1} fade speed={1} />
        
        <fog attach="fog" args={['#0B0C10', 5, 25]} />
      </Canvas>
    </div>
  );
}
