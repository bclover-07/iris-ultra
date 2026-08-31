'use client';

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export default function Starfield({ count = 3000 }) {
  const pointsRef = useRef<THREE.Points>(null);

  const particlesPosition = useMemo(() => {
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 60;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 60;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 60;
    }
    return positions;
  }, [count]);

  const particlesColor = useMemo(() => {
    const colors = new Float32Array(count * 3);
    const colorOptions = [
      new THREE.Color('#FFFFFF'),
      new THREE.Color('#FFD700'),
      new THREE.Color('#00E5FF'),
      new THREE.Color('#C77DFF'),
      new THREE.Color('#FFF176'),
    ];
    for (let i = 0; i < count; i++) {
      const color = colorOptions[Math.floor(Math.random() * colorOptions.length)];
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;
    }
    return colors;
  }, [count]);

  const sizes = useMemo(() => {
    const s = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      s[i] = Math.random() * 0.12 + 0.02;
    }
    return s;
  }, [count]);

  useFrame((state) => {
    if (pointsRef.current) {
      pointsRef.current.rotation.y = state.clock.getElapsedTime() * 0.03;
      pointsRef.current.rotation.x = state.clock.getElapsedTime() * 0.015;

      const mouseX = (state.mouse.x * Math.PI) / 8;
      const mouseY = (state.mouse.y * Math.PI) / 8;
      pointsRef.current.position.x += (mouseX - pointsRef.current.position.x) * 0.08;
      pointsRef.current.position.y += (mouseY - pointsRef.current.position.y) * 0.08;
    }
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={particlesPosition.length / 3}
          array={particlesPosition}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-color"
          count={particlesColor.length / 3}
          array={particlesColor}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.08}
        vertexColors
        transparent
        opacity={0.9}
        sizeAttenuation={true}
      />
    </points>
  );
}
