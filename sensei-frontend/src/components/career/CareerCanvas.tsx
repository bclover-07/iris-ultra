'use client';

import { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { Float, MeshDistortMaterial, Sphere, Line } from '@react-three/drei';

function BranchingPaths() {
  return (
    <group>
      <Float speed={2} rotationIntensity={1} floatIntensity={1}>
        <Sphere args={[1, 32, 32]} position={[0, 0, 0]}>
          <MeshDistortMaterial color="#FFD700" speed={5} distort={0.4} />
        </Sphere>
      </Float>
      <Line points={[[0, 0, 0], [-3, 2, -2]]} color="#00E676" lineWidth={2} />
      <Line points={[[0, 0, 0], [3, 2, -2]]} color="#FF5252" lineWidth={2} />
      <Line points={[[0, 0, 0], [0, 3, -3]]} color="#448AFF" lineWidth={2} />
    </group>
  );
}

export default function CareerCanvas() {
  return (
    <Canvas camera={{ position: [0, 0, 5] }}>
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} />
      <Suspense fallback={null}>
        <BranchingPaths />
      </Suspense>
    </Canvas>
  );
}
