'use client';

import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { motion, AnimatePresence } from 'framer-motion';

export default function NpcSystem({ npcs = [], playerMessages = {} }: { npcs: any[], playerMessages: Record<string, string> }) {
  return (
    <>
      {npcs.map((npc) => (
        <NpcMesh key={npc.id} npc={npc} message={playerMessages[npc.id]} />
      ))}
    </>
  );
}

function NpcMesh({ npc, message }: { npc: any, message?: string }) {
  const groupRef = useRef<THREE.Group>(null);
  const leftLegRef = useRef<THREE.Group>(null);
  const rightLegRef = useRef<THREE.Group>(null);
  const bodyRef = useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    if (!groupRef.current) return;

    groupRef.current.position.lerp(new THREE.Vector3(npc.position.x, npc.position.y, npc.position.z), 0.05);
    

    let diff = (npc.rotation.y || 0) - groupRef.current.rotation.y;
    while (diff < -Math.PI) diff += Math.PI * 2;
    while (diff > Math.PI) diff -= Math.PI * 2;
    groupRef.current.rotation.y += diff * 0.1;


    if (npc.animation === 'walk') {
      const t = state.clock.elapsedTime * 8;
      if (leftLegRef.current) leftLegRef.current.rotation.x = Math.sin(t) * 0.6;
      if (rightLegRef.current) rightLegRef.current.rotation.x = Math.sin(t + Math.PI) * 0.6;
      if (bodyRef.current) bodyRef.current.position.y = 0.85 + Math.abs(Math.sin(t * 2)) * 0.05;
    } else {
      if (leftLegRef.current) leftLegRef.current.rotation.x = THREE.MathUtils.lerp(leftLegRef.current.rotation.x, 0, 0.1);
      if (rightLegRef.current) rightLegRef.current.rotation.x = THREE.MathUtils.lerp(rightLegRef.current.rotation.x, 0, 0.1);
      if (bodyRef.current) bodyRef.current.position.y = THREE.MathUtils.lerp(bodyRef.current.position.y, 0.85, 0.1);
      

      if (!npc.isInvader) {
         groupRef.current.position.y = (npc.position.y || 0) + Math.sin(state.clock.elapsedTime * 2) * 0.05;
      }
    }
  });

  const color = npc.color || '#6BCB77';

  return (
    <group ref={groupRef}>
      {}
      <mesh position={[0, 1.5, 0]} castShadow>
        <boxGeometry args={[0.5, 0.5, 0.5]} />
        <meshToonMaterial color={npc.isInvader ? '#ef4444' : '#FFDCB3'} />
        {}
        <mesh position={[0.1, 0.05, 0.26]}>
          <boxGeometry args={[0.1, 0.1, 0.05]} />
          <meshBasicMaterial color={npc.isInvader ? '#FFFF00' : '#000'} />
        </mesh>
        <mesh position={[-0.1, 0.05, 0.26]}>
          <boxGeometry args={[0.1, 0.1, 0.05]} />
          <meshBasicMaterial color={npc.isInvader ? '#FFFF00' : '#000'} />
        </mesh>
      </mesh>
      
      {}
      <mesh ref={bodyRef} position={[0, 0.85, 0]} castShadow>
        <boxGeometry args={[0.6, 0.8, 0.3]} />
        <meshToonMaterial color={color} />
      </mesh>
      
      {}
      <group ref={leftLegRef} position={[-0.15, 0.45, 0]}>
        <mesh position={[0, -0.225, 0]} castShadow>
          <boxGeometry args={[0.2, 0.45, 0.2]} />
          <meshToonMaterial color="#333" />
        </mesh>
      </group>
      <group ref={rightLegRef} position={[0.15, 0.45, 0]}>
        <mesh position={[0, -0.225, 0]} castShadow>
          <boxGeometry args={[0.2, 0.45, 0.2]} />
          <meshToonMaterial color="#333" />
        </mesh>
      </group>

      {}
      <Html position={[0, 2.3, 0]} center style={{ pointerEvents: 'none' }}>
        <div style={{ background: 'rgba(0,0,0,0.5)', padding: '2px 6px', borderRadius: 6, color: 'white', fontFamily: 'Fredoka', fontSize: '10px', whiteSpace: 'nowrap' }}>
          {npc.isInvader ? '💀' : '🤖'} {npc.name}
        </div>
      </Html>

      {}
      <Html position={[0, 2.8, 0]} center style={{ pointerEvents: 'none' }}>
        <AnimatePresence>
          {message && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.5, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.5, y: -10 }}
              style={{ background: 'white', border: `3px solid ${color}`, padding: '6px 12px', borderRadius: 12, color: '#333', fontFamily: 'Fredoka', fontSize: '12px', whiteSpace: 'nowrap', fontWeight: 600, boxShadow: '0 4px 8px rgba(0,0,0,0.2)', position: 'relative' }}
            >
              {message}
              <div style={{ position: 'absolute', bottom: -6, left: '50%', transform: 'translateX(-50%)', width: 0, height: 0, borderLeft: '6px solid transparent', borderRight: '6px solid transparent', borderTop: `6px solid ${color}` }} />
            </motion.div>
          )}
        </AnimatePresence>
      </Html>
    </group>
  );
}
