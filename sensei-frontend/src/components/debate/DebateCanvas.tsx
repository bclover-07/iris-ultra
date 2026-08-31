'use client';

import { Suspense, useEffect } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { Physics } from '@react-three/rapier';
import { Environment, OrbitControls, PerspectiveCamera } from '@react-three/drei';
import dynamic from 'next/dynamic';

const UniversityHall = dynamic(() => import('./rooms/UniversityHall'), { ssr: false });
const CourtRoom = dynamic(() => import('./rooms/CourtRoom'), { ssr: false });
const StudentAvatar = dynamic(() => import('./StudentAvatar'), { ssr: false });
const AIOpponentAvatar = dynamic(() => import('./AIOpponentAvatar'), { ssr: false });

function CameraController({ pov }: { pov: '1st' | '3rd' }) {
  const { camera } = useThree();
  useEffect(() => {
    if (pov === '1st') {
      camera.position.set(-2.8, 2.4, 0.8);
      camera.lookAt(2, 1.4, 0);
    } else {
      camera.position.set(0, 3, 8);
      camera.lookAt(0, 1, 0);
    }
  }, [pov, camera]);
  return null;
}

export default function DebateCanvas({ roomStyle, aiPersonality, sessionState, pov = '3rd' }: { roomStyle: string, aiPersonality: string, sessionState: any, pov?: '1st' | '3rd' }) {
  return (
    <div className="w-full h-full absolute inset-0 bg-slate-900">
      <Canvas shadows camera={{ position: [0, 2, 6], fov: 45 }}>
        <CameraController pov={pov} />
        <Suspense fallback={null}>
          <Physics gravity={[0, -9.8, 0]}>
            {}
            <ambientLight intensity={0.5} />
            <directionalLight position={[5, 10, 5]} intensity={1.5} castShadow />
            <Environment preset="city" />

            {}
            {roomStyle === 'court' ? <CourtRoom /> : <UniversityHall />}

            {}
            <StudentAvatar position={[-2, 0, 0]} rotation={[0, Math.PI / 4, 0]} />
            <AIOpponentAvatar position={[2, 0, 0]} rotation={[0, -Math.PI / 4, 0]} personality={aiPersonality} sessionState={sessionState} />
            
            {}
            
          </Physics>
        </Suspense>
        
        <OrbitControls 
          enablePan={false} 
          enableZoom={false} 
          minAzimuthAngle={-Math.PI / 8} 
          maxAzimuthAngle={Math.PI / 8} 
          minPolarAngle={Math.PI / 3} 
          maxPolarAngle={Math.PI / 2}
        />
      </Canvas>
    </div>
  );
}
