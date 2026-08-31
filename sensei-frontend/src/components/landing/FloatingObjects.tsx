'use client';

import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Float, Icosahedron, Box, Torus, Dodecahedron, Sparkles } from '@react-three/drei';
import * as THREE from 'three';

export default function FloatingObjects() {
  const group = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (group.current) {
      const mouseX = (state.mouse.x * Math.PI) / 12;
      const mouseY = (state.mouse.y * Math.PI) / 12;
      group.current.position.x += (mouseX - group.current.position.x) * 0.06;
      group.current.position.y += (mouseY - group.current.position.y) * 0.06;
    }
  });

  return (
    <group ref={group}>
      <ambientLight intensity={0.6} />
      <pointLight position={[10, 10, 10]} intensity={2} color="#FFD700" />
      <pointLight position={[-10, -10, -10]} intensity={1.5} color="#00E5FF" />
      <pointLight position={[0, 5, -5]} intensity={1} color="#C77DFF" />

      <Float speed={2} rotationIntensity={1.5} floatIntensity={2} position={[-4, 2, -2]}>
        <Box args={[1.5, 0.2, 2]}>
          <meshStandardMaterial color="#FFD700" emissive="#FFD700" emissiveIntensity={0.4} roughness={0.2} metalness={0.9} />
        </Box>
        <pointLight position={[0, 0.5, 0]} intensity={0.5} color="#FFD700" distance={3} />
      </Float>

      <Float speed={1.5} rotationIntensity={2} floatIntensity={1.5} position={[4, 1, -3]}>
        <Icosahedron args={[1, 1]}>
          <meshStandardMaterial color="#00E5FF" emissive="#00E5FF" emissiveIntensity={0.7} wireframe />
        </Icosahedron>
        <pointLight position={[0, 0, 0]} intensity={0.8} color="#00E5FF" distance={4} />
      </Float>

      <Float speed={2.5} rotationIntensity={1} floatIntensity={2.5} position={[-3, -2, -1]}>
        <Dodecahedron args={[0.8]}>
          <meshStandardMaterial color="#FF4500" emissive="#FF4500" emissiveIntensity={0.5} roughness={0.3} metalness={0.7} />
        </Dodecahedron>
      </Float>

      <Float speed={3} rotationIntensity={2} floatIntensity={1.5} position={[3, -2, -2]}>
        <Torus args={[0.8, 0.25, 16, 32]}>
          <meshStandardMaterial color="#FFF176" emissive="#FFD700" emissiveIntensity={0.6} metalness={1} roughness={0.05} />
        </Torus>
        <pointLight position={[0, 0, 0]} intensity={0.4} color="#FFD700" distance={3} />
      </Float>

      <Float speed={1.8} rotationIntensity={1.2} floatIntensity={2} position={[0, 3, -4]}>
        <Icosahedron args={[0.5, 0]}>
          <meshStandardMaterial color="#C77DFF" emissive="#C77DFF" emissiveIntensity={0.6} wireframe />
        </Icosahedron>
      </Float>

      <Sparkles count={200} scale={15} size={4} speed={0.3} opacity={0.5} color="#FFD700" />
      <Sparkles count={100} scale={15} size={3} speed={0.2} opacity={0.3} color="#00E5FF" />
    </group>
  );
}
