'use client';

import { Suspense, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { ContactShadows, OrbitControls, Stars, Float } from '@react-three/drei';
import * as THREE from 'three';

import Avatar3D from '../shared/Avatar3D';

function CorporateRoom() {
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.8, 0]} receiveShadow>
        <planeGeometry args={[14, 14]} />
        <meshStandardMaterial color="#2A1F1A" roughness={0.3} metalness={0.15} />
      </mesh>
      {}
      {[-3, -1, 1, 3].map(x => [-3, -1, 1, 3].map(z => (
        <mesh key={`${x}${z}`} rotation={[-Math.PI / 2, 0, 0]} position={[x, -0.79, z]}>
          <planeGeometry args={[1.9, 1.9]} />
          <meshStandardMaterial color={((x + z) % 4 === 0) ? "#3D2B1F" : "#2A1F1A"} roughness={0.2} />
        </mesh>
      )))}
      {}
      <mesh position={[0, 2, -4.5]} receiveShadow>
        <planeGeometry args={[14, 7]} />
        <meshStandardMaterial color="#1A2332" roughness={0.85} />
      </mesh>
      {}
      <mesh position={[-7, 2, 0]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[9, 7]} />
        <meshStandardMaterial color="#1E2A38" roughness={0.85} />
      </mesh>
      <mesh position={[7, 2, 0]} rotation={[0, -Math.PI / 2, 0]}>
        <planeGeometry args={[9, 7]} />
        <meshStandardMaterial color="#1E2A38" roughness={0.85} />
      </mesh>
      {}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 5.5, 0]}>
        <planeGeometry args={[14, 9]} />
        <meshStandardMaterial color="#141C24" />
      </mesh>

      {}
      <mesh position={[0, 2.2, -4.4]}>
        <planeGeometry args={[3.5, 2.8]} />
        <meshStandardMaterial color="#0D47A1" emissive="#1565C0" emissiveIntensity={0.5} />
      </mesh>
      {}
      {[[-Math.PI / 2, 2.2, -4.38, 3.6, 0.04], [0, 0, 0, 0, 0]].slice(0,1).map((_, i) => (
        <mesh key={i} position={[0, 3.65, -4.38]}>
          <boxGeometry args={[3.6, 0.06, 0.06]} />
          <meshStandardMaterial color="#455A64" metalness={0.5} />
        </mesh>
      ))}
      <mesh position={[0, 0.75, -4.38]}>
        <boxGeometry args={[3.6, 0.06, 0.06]} />
        <meshStandardMaterial color="#455A64" metalness={0.5} />
      </mesh>
      <mesh position={[-1.77, 2.2, -4.38]}>
        <boxGeometry args={[0.06, 2.95, 0.06]} />
        <meshStandardMaterial color="#455A64" metalness={0.5} />
      </mesh>
      <mesh position={[1.77, 2.2, -4.38]}>
        <boxGeometry args={[0.06, 2.95, 0.06]} />
        <meshStandardMaterial color="#455A64" metalness={0.5} />
      </mesh>

      {}
      <mesh position={[0, -0.08, -1.6]} castShadow receiveShadow>
        <boxGeometry args={[2.2, 0.09, 0.9]} />
        <meshStandardMaterial color="#4E342E" roughness={0.25} metalness={0.05} />
      </mesh>
      {}
      {[[-1, -0.45, -1.2], [1, -0.45, -1.2], [-1, -0.45, -2], [1, -0.45, -2]].map((p, i) => (
        <mesh key={i} position={p as [number, number, number]}>
          <cylinderGeometry args={[0.035, 0.035, 0.75, 8]} />
          <meshStandardMaterial color="#3E2723" metalness={0.3} />
        </mesh>
      ))}
      {}
      <mesh position={[0.4, -0.02, -1.45]} rotation={[0, -0.2, 0]}>
        <boxGeometry args={[0.38, 0.015, 0.26]} />
        <meshStandardMaterial color="#212121" metalness={0.8} roughness={0.2} />
      </mesh>
      <mesh position={[0.4, 0.12, -1.58]} rotation={[-0.95, -0.2, 0]}>
        <boxGeometry args={[0.38, 0.23, 0.012]} />
        <meshStandardMaterial color="#212121" metalness={0.8} roughness={0.2} />
      </mesh>
      {}
      <mesh position={[0.4, 0.12, -1.575]} rotation={[-0.95, -0.2, 0]}>
        <planeGeometry args={[0.34, 0.21]} />
        <meshStandardMaterial color="#0D47A1" emissive="#1565C0" emissiveIntensity={0.6} />
      </mesh>
      {}
      <mesh position={[-0.5, -0.02, -1.5]}>
        <cylinderGeometry args={[0.05, 0.042, 0.1, 12]} />
        <meshStandardMaterial color="#E53935" roughness={0.7} />
      </mesh>

      {}
      <mesh position={[0, 0.5, -2.7]} castShadow>
        <boxGeometry args={[0.65, 1.1, 0.06]} />
        <meshStandardMaterial color="#0D1B2A" roughness={0.8} />
      </mesh>
      <mesh position={[0, -0.12, -2.5]}>
        <boxGeometry args={[0.6, 0.065, 0.6]} />
        <meshStandardMaterial color="#0D1B2A" roughness={0.8} />
      </mesh>

      {}
      <mesh position={[-5.5, 1.2, -3]}>
        <boxGeometry args={[0.9, 2.8, 0.32]} />
        <meshStandardMaterial color="#4E342E" roughness={0.7} />
      </mesh>
      {['#C62828', '#1565C0', '#2E7D32', '#FF8F00', '#6A1B9A', '#00838F'].map((c, i) => (
        <mesh key={i} position={[-5.5, -0.25 + i * 0.48, -2.86]}>
          <boxGeometry args={[0.7, 0.18, 0.22]} />
          <meshStandardMaterial color={c} roughness={0.8} />
        </mesh>
      ))}

      {}
      <mesh position={[4.5, -0.55, -3]}>
        <cylinderGeometry args={[0.14, 0.1, 0.32, 10]} />
        <meshStandardMaterial color="#6D4C41" roughness={0.9} />
      </mesh>
      <mesh position={[4.5, -0.08, -3]}>
        <sphereGeometry args={[0.28, 10, 10]} />
        <meshStandardMaterial color="#2E7D32" roughness={0.85} />
      </mesh>
      <mesh position={[4.6, 0.05, -2.8]}>
        <sphereGeometry args={[0.16, 8, 8]} />
        <meshStandardMaterial color="#388E3C" roughness={0.85} />
      </mesh>

      {}
      <mesh position={[0.6, -0.02, -1.22]}>
        <boxGeometry args={[0.32, 0.085, 0.085]} />
        <meshStandardMaterial color="#FFD700" metalness={0.6} roughness={0.2} />
      </mesh>

      {}
      <mesh position={[0, 5.4, -1]}>
        <boxGeometry args={[1.5, 0.08, 0.4]} />
        <meshStandardMaterial color="#ECEFF1" emissive="#ECEFF1" emissiveIntensity={0.5} />
      </mesh>
    </group>
  );
}

export default function InterviewCanvas({
  roomType = 'corporate',
  avatarAnimation = 'idle',
  interviewerName = 'Alex'
}: {
  roomType?: string;
  avatarAnimation?: string;
  interviewerName?: string;
}) {
  return (
    <Canvas
      camera={{ position: [0, 1.3, 2.2], fov: 48, near: 0.1, far: 100 }}
      shadows
      style={{ width: '100%', height: '100%' }}
      gl={{ antialias: true, alpha: false }}
    >
      <color attach="background" args={['#0a1628']} />
      <fog attach="fog" args={['#0a1628', 10, 22]} />

      <ambientLight color="#D0E8FF" intensity={0.35} />
      <pointLight position={[2, 2.5, 0.5]} color="#FF8F00" intensity={0.7} distance={6} />
      <spotLight position={[0, 5, 1.5]} angle={0.38} penumbra={0.6} intensity={1.1} castShadow color="#FFF3E0" shadow-mapSize={[1024, 1024]} target-position={[0, 0.6, -2]} />
      <directionalLight position={[-3, 4, 2]} intensity={0.25} color="#B3E5FC" />
      <pointLight position={[0, 1.5, -3.8]} color="#1565C0" intensity={0.5} distance={4} />

      <Stars radius={50} depth={40} count={800} factor={2} fade speed={0.5} />

      <Suspense fallback={null}>
        <CorporateRoom />
        <group position={[0, 0, -2]}>
          <Avatar3D animation={avatarAnimation} />
        </group>
        <ContactShadows position={[0, -0.79, 0]} opacity={0.5} scale={12} blur={2.5} far={5} />
      </Suspense>

      <OrbitControls
        enablePan={false}
        enableZoom={true}
        enableRotate={true}
        minPolarAngle={Math.PI / 6}
        maxPolarAngle={Math.PI / 1.8}
        minAzimuthAngle={-Math.PI / 4}
        maxAzimuthAngle={Math.PI / 4}
        minDistance={1.5}
        maxDistance={4}
        target={[0, 0.5, -1]}
        dampingFactor={0.08}
        enableDamping
      />
    </Canvas>
  );
}
