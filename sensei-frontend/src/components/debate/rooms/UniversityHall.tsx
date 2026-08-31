'use client';

import { RigidBody } from '@react-three/rapier';

export default function UniversityHall() {
  return (
    <group>
      {}
      <RigidBody type="fixed">
        <mesh receiveShadow position={[0, -0.1, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[50, 50]} />
          <meshStandardMaterial color="#2d1b0d" roughness={0.1} metalness={0.2} />
        </mesh>
      </RigidBody>

      {}
      <RigidBody type="fixed">
        <mesh receiveShadow position={[0, 0.1, 0]}>
          <boxGeometry args={[15, 0.2, 10]} />
          <meshStandardMaterial color="#4a0404" roughness={0.3} />
        </mesh>
      </RigidBody>

      {}
      <mesh position={[0, 0.21, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[14, 9]} />
        <meshStandardMaterial color="#8B0000" roughness={0.9} />
      </mesh>

      {}
      <mesh position={[0, 5, -5]} receiveShadow>
        <boxGeometry args={[30, 10, 0.5]} />
        <meshStandardMaterial color="#3E2723" roughness={0.6} />
      </mesh>

      {}
      <mesh position={[0, 5, -4.7]}>
        <boxGeometry args={[30, 0.1, 0.1]} />
        <meshStandardMaterial color="#FFD700" metalness={0.8} roughness={0.2} />
      </mesh>
      <mesh position={[0, 2, -4.7]}>
        <boxGeometry args={[30, 0.1, 0.1]} />
        <meshStandardMaterial color="#FFD700" metalness={0.8} roughness={0.2} />
      </mesh>

      {}
      {[-8, -4, 4, 8].map((x, i) => (
        <group key={i} position={[x, 5, -4.5]}>
          <mesh castShadow>
            <cylinderGeometry args={[0.4, 0.4, 10, 16]} />
            <meshStandardMaterial color="#E0E0E0" roughness={0.2} />
          </mesh>
          {}
          <mesh position={[0, -4.8, 0]}>
            <boxGeometry args={[1.2, 0.4, 1.2]} />
            <meshStandardMaterial color="#BDBDBD" />
          </mesh>
          {}
          <mesh position={[0, 4.8, 0]}>
            <boxGeometry args={[1.4, 0.4, 1.4]} />
            <meshStandardMaterial color="#BDBDBD" />
          </mesh>
        </group>
      ))}

      {}
      <group position={[-2, 0, 1]}>
        <RigidBody type="fixed">
          <mesh position={[0, 0.6, 0]} castShadow>
            <boxGeometry args={[0.9, 1.2, 0.7]} />
            <meshStandardMaterial color="#5D4037" roughness={0.4} />
          </mesh>
          {}
          <mesh position={[0, 1.25, 0]} rotation={[0.2, 0, 0]}>
            <boxGeometry args={[1.1, 0.1, 0.9]} />
            <meshStandardMaterial color="#3E2723" />
          </mesh>
           {}
           <mesh position={[0, 0.8, 0.36]} rotation={[Math.PI / 2, 0, 0]}>
             <cylinderGeometry args={[0.2, 0.2, 0.05, 32]} />
             <meshStandardMaterial color="#FFD700" metalness={0.8} />
           </mesh>
         </RigidBody>
       </group>

       <group position={[2, 0, 1]}>
         <RigidBody type="fixed">
           <mesh position={[0, 0.6, 0]} castShadow>
             <boxGeometry args={[0.9, 1.2, 0.7]} />
             <meshStandardMaterial color="#5D4037" roughness={0.4} />
           </mesh>
           <mesh position={[0, 1.25, 0]} rotation={[0.2, 0, 0]}>
             <boxGeometry args={[1.1, 0.1, 0.9]} />
             <meshStandardMaterial color="#3E2723" />
           </mesh>
           {}
           <mesh position={[0, 0.8, 0.36]} rotation={[Math.PI / 2, 0, 0]}>
             <cylinderGeometry args={[0.2, 0.2, 0.05, 32]} />
             <meshStandardMaterial color="#FFD700" metalness={0.8} />
           </mesh>
        </RigidBody>
      </group>

      <group position={[2, 0, 1]}>
        <RigidBody type="fixed">
          <mesh position={[0, 0.6, 0]} castShadow>
            <boxGeometry args={[0.9, 1.2, 0.7]} />
            <meshStandardMaterial color="#5D4037" roughness={0.4} />
          </mesh>
          <mesh position={[0, 1.25, 0]} rotation={[0.2, 0, 0]}>
            <boxGeometry args={[1.1, 0.1, 0.9]} />
            <meshStandardMaterial color="#3E2723" />
          </mesh>
          <mesh position={[0, 0.8, 0.36]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.2, 0.2, 0.05, 32]} />
            <meshStandardMaterial color="#FFD700" metalness={0.8} />
          </mesh>
        </RigidBody>
      </group>
    </group>
  );
}
