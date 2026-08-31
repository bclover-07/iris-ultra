'use client';

import { RigidBody } from '@react-three/rapier';

export default function CourtRoom() {
  return (
    <group>
      {}
      <RigidBody type="fixed">
        <mesh receiveShadow position={[0, -0.1, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[50, 50]} />
          <meshStandardMaterial color="#455A64" roughness={0.1} metalness={0.2} />
        </mesh>
      </RigidBody>

      {}
      <RigidBody type="fixed">
        <mesh position={[0, 1.2, -4]} castShadow>
          <boxGeometry args={[6, 2.4, 2]} />
          <meshStandardMaterial color="#3E2723" roughness={0.4} />
        </mesh>
        {}
        <mesh position={[0, 2, -4.5]}>
          <boxGeometry args={[1, 2, 0.5]} />
          <meshStandardMaterial color="#212121" />
        </mesh>
      </RigidBody>

      {}
      <mesh position={[0, 5, -6]} receiveShadow>
        <planeGeometry args={[30, 10]} />
        <meshStandardMaterial color="#263238" />
      </mesh>
      <mesh position={[0, 4, -5.9]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.8, 0.8, 0.1, 32]} />
        <meshStandardMaterial color="#FFD700" metalness={0.8} roughness={0.2} />
      </mesh>

      {}
      <mesh position={[-15, 5, 0]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[30, 10]} />
        <meshStandardMaterial color="#37474F" />
      </mesh>
      <mesh position={[15, 5, 0]} rotation={[0, -Math.PI / 2, 0]}>
        <planeGeometry args={[30, 10]} />
        <meshStandardMaterial color="#37474F" />
      </mesh>

      {}
      <group position={[-3, 0, 0]}>
        <RigidBody type="fixed">
          <mesh position={[0, 0.5, 0]} castShadow>
            <boxGeometry args={[2, 1, 4]} />
            <meshStandardMaterial color="#5D4037" />
          </mesh>
          {}
          <mesh position={[0, 1.05, 0]}>
            <boxGeometry args={[2.2, 0.1, 4.2]} />
            <meshStandardMaterial color="#3E2723" />
          </mesh>
        </RigidBody>
      </group>

      <group position={[3, 0, 0]}>
        <RigidBody type="fixed">
          <mesh position={[0, 0.5, 0]} castShadow>
            <boxGeometry args={[2, 1, 4]} />
            <meshStandardMaterial color="#5D4037" />
          </mesh>
          <mesh position={[0, 1.05, 0]}>
            <boxGeometry args={[2.2, 0.1, 4.2]} />
            <meshStandardMaterial color="#3E2723" />
          </mesh>
        </RigidBody>
      </group>

      {}
      {[2, 4, 6].map((z, i) => (
        <group key={i} position={[0, 0, z + 5]}>
          <mesh position={[-5, 0.3, 0]}>
            <boxGeometry args={[6, 0.1, 0.8]} />
            <meshStandardMaterial color="#3E2723" />
          </mesh>
          <mesh position={[5, 0.3, 0]}>
            <boxGeometry args={[6, 0.1, 0.8]} />
            <meshStandardMaterial color="#3E2723" />
          </mesh>
        </group>
      ))}

      {}
      <ambientLight intensity={0.4} />
      <directionalLight position={[5, 10, 5]} intensity={1.2} castShadow />
      <pointLight position={[0, 8, -2]} intensity={20} color="#FFFAEA" />
    </group>
  );
}
