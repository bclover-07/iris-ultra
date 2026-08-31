'use client';

import { useRef, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Stars, Float, MeshDistortMaterial } from '@react-three/drei';
import * as THREE from 'three';


function GoldenOrb() {
  const ref = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (!ref.current) return;
    ref.current.rotation.y = clock.elapsedTime * 0.07;
    ref.current.rotation.x = clock.elapsedTime * 0.04;
  });
  return (
    <Float speed={1.2} rotationIntensity={0.15} floatIntensity={1.0}>
      <mesh ref={ref} position={[2.8, 0.4, -2]}>
        <icosahedronGeometry args={[1.6, 1]} />
        <MeshDistortMaterial
          color="#FFD700"
          distort={0.28}
          speed={1.5}
          roughness={0.08}
          metalness={0.95}
          emissive="#FF7A00"
          emissiveIntensity={0.12}
        />
      </mesh>
    </Float>
  );
}


function CyanRing() {
  const ref = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (!ref.current) return;
    ref.current.rotation.x = clock.elapsedTime * 0.28;
    ref.current.rotation.z = clock.elapsedTime * 0.12;
  });
  return (
    <Float speed={2.0} rotationIntensity={0.45} floatIntensity={0.7}>
      <mesh ref={ref} position={[-2.8, -1.2, -0.5]}>
        <torusGeometry args={[1.05, 0.26, 16, 60]} />
        <meshStandardMaterial
          color="#00f3ff"
          emissive="#00f3ff"
          emissiveIntensity={0.45}
          roughness={0.1}
          metalness={0.9}
          transparent
          opacity={0.82}
        />
      </mesh>
    </Float>
  );
}


function PurpleGem() {
  const ref = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (!ref.current) return;
    ref.current.rotation.y = clock.elapsedTime * 0.2;
    ref.current.rotation.x = clock.elapsedTime * 0.1;
  });
  return (
    <Float speed={1.8} rotationIntensity={0.4} floatIntensity={0.9}>
      <mesh ref={ref} position={[0.8, -2.8, -2.5]}>
        <octahedronGeometry args={[0.85, 0]} />
        <meshStandardMaterial
          color="#9B51E0"
          emissive="#9B51E0"
          emissiveIntensity={0.32}
          roughness={0.18}
          metalness={0.75}
        />
      </mesh>
    </Float>
  );
}


const ORB_DATA: Array<{ pos: [number, number, number]; color: string; size: number; speed: number }> = [
  { pos: [-1.2, 2.2, -3.5], color: '#FF7A00', size: 0.22, speed: 1.3 },
  { pos: [3.5, -1.8, -3.5], color: '#4ADE80', size: 0.18, speed: 1.6 },
  { pos: [-3.8, 1.0, -4.0], color: '#00f3ff', size: 0.15, speed: 1.1 },
  { pos: [1.5, 3.2, -5.0], color: '#FFD700', size: 0.20, speed: 2.0 },
];

function SmallOrbs() {
  return (
    <>
      {ORB_DATA.map(({ pos, color, size, speed }, i) => (
        <Float key={i} speed={speed} rotationIntensity={0.1} floatIntensity={0.6}>
          <mesh position={pos}>
            <sphereGeometry args={[size, 12, 12]} />
            <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.7} roughness={0.05} />
          </mesh>
        </Float>
      ))}
    </>
  );
}


function Scene() {
  return (
    <>
      <Stars radius={120} depth={60} count={2500} factor={3.5} saturation={0.4} fade speed={0.4} />
      <ambientLight intensity={0.35} />
      <pointLight position={[5, 5, 5]} intensity={4.5} color="#FFD700" />
      <pointLight position={[-5, -2, 3]} intensity={2.5} color="#00f3ff" />
      <pointLight position={[0, -4, 2]} intensity={1.8} color="#9B51E0" />
      <GoldenOrb />
      <CyanRing />
      <PurpleGem />
      <SmallOrbs />
    </>
  );
}


export default function HeroScene() {
  return (
    <Canvas
      camera={{ position: [0, 0, 8], fov: 52 }}
      gl={{ alpha: true, antialias: true, powerPreference: 'high-performance' }}
      dpr={[1, 2]}
      style={{ width: '100%', height: '100%' }}
    >
      <Suspense fallback={null}>
        <Scene />
      </Suspense>
    </Canvas>
  );
}
