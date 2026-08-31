'use client';

import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import Avatar3D from '../shared/Avatar3D';

export default function AIOpponentAvatar({ position, rotation, personality, sessionState }: { position: [number, number, number], rotation: [number, number, number], personality: string, sessionState: any }) {
  const group = useRef<any>();
  

  const getColors = () => {
    switch (personality) {
      case 'aggressive_politician': return { body: '#1A237E', head: '#CFD8DC' };
      case 'calm_professor': return { body: '#4E342E', head: '#FFCCBC' };
      case 'toxic_opponent': return { body: '#B71C1C', head: '#FFAB91' };
      default: return { body: '#37474F', head: '#FFCCBC' };
    }
  };
  const colors = getColors();

  useFrame((state) => {
    if (group.current) {

      const speed = sessionState?.heatLevel || 1;
      group.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * (2 + speed)) * 0.03;
      
      if (sessionState?.aiEmotion === 'aggressive') {
        group.current.rotation.x = Math.sin(state.clock.elapsedTime * 10) * 0.05;
      }
    }
  });

  return (
    <group ref={group} position={position} rotation={rotation}>
      <group position={[0, 0.8, 0]}>
        <Avatar3D 
          animation={sessionState?.aiEmotion || 'idle'} 
          suitColor={colors.body} 
          tieColor="#111" 
          accentColor="#222" 
          skinColor={colors.head}
        />
      </group>
    </group>
  );
}
