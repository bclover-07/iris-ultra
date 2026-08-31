'use client';

import { Canvas } from '@react-three/fiber';
import Starfield from '@/components/landing/Starfield';
import FloatingObjects from '@/components/landing/FloatingObjects';

export default function RegisterCanvas() {
  return (
    <Canvas camera={{ position: [0, 0, 10], fov: 60 }}>
      <Starfield count={1500} />
      <FloatingObjects />
    </Canvas>
  );
}
