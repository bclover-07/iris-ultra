'use client';

import { Suspense, useEffect, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment } from '@react-three/drei';
import Avatar3DScene from '@/components/Avatar3DScene';
import { useSearchParams } from 'next/navigation';

function AvatarBridgeContent() {
  const searchParams = useSearchParams();
  const initialMood = searchParams.get('mood') || 'idle';
  const [mood, setMood] = useState<any>(initialMood);

  useEffect(() => {
    // Expose a global function for Flutter WebView to call
    (window as any).setMood = (newMood: string) => {
      setMood(newMood);
    };
  }, []);

  return (
    <div style={{ width: '100vw', height: '100vh', background: 'transparent' }}>
      <Canvas
        camera={{ position: [0, 1.5, 3], fov: 50 }}
        style={{ background: 'transparent' }}
        gl={{ alpha: true, antialias: true }}
      >
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 5]} intensity={1} castShadow />
        
        <Suspense fallback={null}>
          <Environment preset="city" />
          <group position={[0, -1, 0]}>
            <Avatar3DScene mood={mood as any} />
          </group>
        </Suspense>
        
        <OrbitControls
          enableZoom={false}
          enablePan={false}
          minPolarAngle={Math.PI / 3}
          maxPolarAngle={Math.PI / 1.5}
          minAzimuthAngle={-Math.PI / 4}
          maxAzimuthAngle={Math.PI / 4}
        />
      </Canvas>
    </div>
  );
}

export default function AvatarBridgePage() {
  return (
    <Suspense fallback={<div style={{ width: '100vw', height: '100vh', background: 'transparent' }} />}>
      <AvatarBridgeContent />
    </Suspense>
  );
}
