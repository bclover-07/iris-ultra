'use client';

import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import Avatar3D from '../shared/Avatar3D';

export default function StudentAvatar({ position, rotation }: { position: [number, number, number], rotation: [number, number, number] }) {
  const group = useRef<any>();

  useFrame((state) => {
    if (group.current) {

      group.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 2) * 0.02;
    }
  });

  return (
    <group ref={group} position={position} rotation={rotation}>
      <group position={[0, 0.8, 0]}>
        <Avatar3D 
          animation="idle" 
          suitColor="#1E88E5" 
          tieColor="#0D47A1" 
          accentColor="#1565C0" 
        />
      </group>
    </group>
  );
}
