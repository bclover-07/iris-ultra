'use client';

import { Canvas, useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import * as THREE from 'three';

function Particles() {
  const points = useRef<THREE.Points>(null);
  
  const count = 25; // Minimalistic, super clean particle density
  
  // Programmatic circular soft particle texture
  const circleTexture = useMemo(() => {
    if (typeof window === 'undefined') return null;
    const canvas = document.createElement('canvas');
    canvas.width = 32;
    canvas.height = 32;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      const gradient = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
      gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
      gradient.addColorStop(0.6, 'rgba(255, 255, 255, 0.85)'); // wider solid core
      gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 32, 32);
    }
    return new THREE.CanvasTexture(canvas);
  }, []);

  const { positions, colors } = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);
    
    // Vibrant but soft Harmonious Palette:
    const palette = [
      [0.6, 0.4, 1.0],   // Purple
      [0.85, 0.68, 1.0], // Lavender
      [1.0, 0.93, 0.35], // Yellow
      [1.0, 0.65, 0.78], // Pink
      [0.45, 0.85, 1.0], // Blue
    ];
    
    for (let i = 0; i < count; i++) {
      // Distribute coordinates across a wide volume
      pos[i * 3] = (Math.random() - 0.5) * 12;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 8;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 4;
      
      const c = palette[Math.floor(Math.random() * palette.length)];
      col[i * 3] = c[0];
      col[i * 3 + 1] = c[1];
      col[i * 3 + 2] = c[2];
    }
    
    return { positions: pos, colors: col };
  }, []);

  useFrame((state) => {
    if (!points.current) return;
    
    const t = state.clock.getElapsedTime();
    
    // Slow, elegant rotation
    points.current.rotation.y = t * 0.005;
    points.current.rotation.x = Math.sin(t * 0.02) * 0.01;
    
    // Very subtle floating wave drift
    const positionsAttr = points.current.geometry.attributes.position;
    if (positionsAttr) {
      const arr = positionsAttr.array as Float32Array;
      for (let i = 0; i < count; i++) {
        arr[i * 3 + 1] += Math.sin(t * 0.4 + i) * 0.0003; 
      }
      positionsAttr.needsUpdate = true;
    }
    
    // Extremely subtle mouse parallax
    const targetX = state.mouse.x * 0.15;
    const targetY = state.mouse.y * 0.1;
    points.current.position.x = THREE.MathUtils.lerp(points.current.position.x, targetX, 0.04);
    points.current.position.y = THREE.MathUtils.lerp(points.current.position.y, targetY, 0.04);
  });

  return (
    <points ref={points}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={positions.length / 3}
          array={positions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-color"
          count={colors.length / 3}
          array={colors}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.11}
        vertexColors
        transparent
        opacity={0.45} // Subtle opacity to avoid looking messy
        sizeAttenuation
        depthWrite={false}
        map={circleTexture || undefined}
      />
    </points>
  );
}

export default function ParticleBackground() {
  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: -1, pointerEvents: 'none' }}>
      <Canvas
        camera={{ position: [0, 0, 5], fov: 60 }}
        gl={{ antialias: true, alpha: true }}
        style={{ width: '100%', height: '100%', pointerEvents: 'none' }}
      >
        <Particles />
      </Canvas>
    </div>
  );
}
