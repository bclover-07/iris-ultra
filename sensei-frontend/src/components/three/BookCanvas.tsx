'use client';

import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, Stars } from '@react-three/drei';
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
          <meshStandardMaterial color="#1a1a2e" roughness={0.3} metalness={0.8} />
        </mesh>
        <mesh position={[0, 0, 0.16]}>
          <boxGeometry args={[2.2, 2.8, 0.02]} />
          <meshStandardMaterial color="#FFD700" roughness={0.4} metalness={0.6} />
        </mesh>
        {[...Array(8)].map((_, i) => (
          <mesh key={i} position={[-0.05, -1.2 + i * 0.35, 0]}>
            <boxGeometry args={[2.3, 0.02, 0.28]} />
            <meshStandardMaterial color="#f5f5dc" />
          </mesh>
        ))}
        <mesh position={[-1.2, 0, 0]}>
          <boxGeometry args={[0.05, 3, 0.35]} />
          <meshStandardMaterial color="#8B7355" metalness={0.5} />
        </mesh>
      </group>
    </Float>
  );
}

function ParticleField() {
  const points = useRef<THREE.Points>(null);

  const particlePositions = useMemo(() => {
    const positions = new Float32Array(2000 * 3);
    for (let i = 0; i < 2000; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 30;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 30;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 30;
    }
    return positions;
  }, []);

  useFrame((state) => {
    if (points.current) {
      points.current.rotation.y = state.clock.elapsedTime * 0.02;
      points.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.01) * 0.1;
    }
  });

  return (
    <points ref={points}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[particlePositions, 3]}
        />
      </bufferGeometry>
      <pointsMaterial size={0.03} color="#FFD700" transparent opacity={0.8} sizeAttenuation />
    </points>
  );
}

function GlowOrb({ position, color, size }: { position: [number, number, number]; color: string; size: number }) {
  const ref = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (ref.current) {
      ref.current.scale.setScalar(size + Math.sin(state.clock.elapsedTime * 2) * 0.1);
    }
  });

  return (
    <mesh ref={ref} position={position}>
      <sphereGeometry args={[1, 32, 32]} />
      <meshStandardMaterial color={color} transparent opacity={0.15} emissive={color} emissiveIntensity={0.3} />
    </mesh>
  );
}

export default function BookCanvas() {
  return (
    <Canvas
      camera={{ position: [0, 0, 8], fov: 50 }}
      style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
      gl={{ antialias: true, alpha: true }}
    >
      <ambientLight intensity={0.3} />
      <directionalLight position={[5, 5, 5]} intensity={1} color="#FFD700" />
      <pointLight position={[-5, -3, 3]} intensity={0.5} color="#FF4500" />
      <pointLight position={[3, 4, -5]} intensity={0.4} color="#A29BFE" />
      
      <FloatingBook />
      <ParticleField />
      <Stars radius={50} depth={50} count={3000} factor={4} saturation={0} fade speed={1.5} />
      
      <GlowOrb position={[-4, 2, -3]} color="#FFD700" size={1.5} />
      <GlowOrb position={[5, -2, -4]} color="#FF4500" size={1.2} />
      <GlowOrb position={[0, 4, -6]} color="#A29BFE" size={1.8} />
      
      <fog attach="fog" args={['#0A0A0F', 5, 30]} />
    </Canvas>
  );
}
