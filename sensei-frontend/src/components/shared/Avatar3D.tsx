'use client';

import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Float } from '@react-three/drei';
import * as THREE from 'three';

export interface Avatar3DProps {
  animation?: string;
  skinColor?: string;
  hairColor?: string;
  suitColor?: string;
  accentColor?: string;
  tieColor?: string;
}

export default function Avatar3D({
  animation = 'idle',
  skinColor = '#FDBCB4',
  hairColor = '#1A1A2E',
  suitColor = '#1A237E',
  accentColor = '#3949AB',
  tieColor = '#C62828'
}: Avatar3DProps) {
  const groupRef = useRef<THREE.Group>(null);
  const headRef = useRef<THREE.Group>(null);
  const bodyRef = useRef<THREE.Group>(null);
  const mouthRef = useRef<THREE.Mesh>(null);
  const leftArmRef = useRef<THREE.Group>(null);
  const rightArmRef = useRef<THREE.Group>(null);
  const leftEyeRef = useRef<THREE.Mesh>(null);
  const rightEyeRef = useRef<THREE.Mesh>(null);
  const blinkTimer = useRef(Math.random() * 5 + 3);
  const blinkState = useRef(0);
  const speakPhase = useRef(0);
  const thinkPhase = useRef(0);

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime;

    if (bodyRef.current) {
      bodyRef.current.position.y = Math.sin(t * 0.9) * 0.012;

      if (animation === 'speaking' || animation === 'aggressive') {
        bodyRef.current.rotation.y = Math.sin(t * 0.5) * 0.05;
      } else {
        bodyRef.current.rotation.y = THREE.MathUtils.lerp(bodyRef.current.rotation.y, 0, 0.05);
      }
    }

    if (headRef.current) {
      headRef.current.rotation.y = Math.sin(t * 0.35) * 0.08;
      if (animation === 'speaking' || animation === 'aggressive') {
        headRef.current.rotation.x = Math.sin(t * 2.2) * 0.07;
        headRef.current.rotation.z = Math.sin(t * 1.3) * 0.03;

        headRef.current.rotation.y += Math.sin(t * 1.1) * 0.1;
      } else if (animation === 'thinking') {
        thinkPhase.current += delta;
        headRef.current.rotation.z = THREE.MathUtils.lerp(headRef.current.rotation.z, 0.14, 0.04);
        headRef.current.rotation.x = THREE.MathUtils.lerp(headRef.current.rotation.x, -0.1, 0.04);
      } else if (animation === 'nodding') {
        headRef.current.rotation.x = Math.sin(t * 4.5) * 0.14;
      } else {
        headRef.current.rotation.z = THREE.MathUtils.lerp(headRef.current.rotation.z, 0, 0.06);
        headRef.current.rotation.x = THREE.MathUtils.lerp(headRef.current.rotation.x, 0, 0.06);
      }
    }

    if (mouthRef.current) {
      if (animation === 'speaking' || animation === 'aggressive') {
        speakPhase.current += delta * 14;
        const o = (Math.sin(speakPhase.current) + 1) * 0.18;
        mouthRef.current.scale.set(1, 0.28 + o, 1);
      } else {
        mouthRef.current.scale.set(1, 0.28, 1);
      }
    }

    if (leftArmRef.current && rightArmRef.current) {
      if (animation === 'speaking' || animation === 'aggressive') {

        leftArmRef.current.rotation.z = 0.4 + Math.sin(t * 2.1) * 0.35;
        leftArmRef.current.rotation.x = Math.sin(t * 1.5) * 0.2;
        rightArmRef.current.rotation.z = -(0.4 + Math.sin(t * 2.1 + Math.PI) * 0.35);
        rightArmRef.current.rotation.x = Math.sin(t * 1.5 + 0.5) * 0.2;
      } else if (animation === 'thinking') {
        leftArmRef.current.rotation.z = 0.15;
        rightArmRef.current.rotation.z = -0.15;
        rightArmRef.current.rotation.x = THREE.MathUtils.lerp(rightArmRef.current.rotation.x, 0.5, 0.05);
      } else {
        leftArmRef.current.rotation.z = THREE.MathUtils.lerp(leftArmRef.current.rotation.z, 0.15, 0.05);
        rightArmRef.current.rotation.z = THREE.MathUtils.lerp(rightArmRef.current.rotation.z, -0.15, 0.05);
        rightArmRef.current.rotation.x = THREE.MathUtils.lerp(rightArmRef.current.rotation.x, 0, 0.05);
      }
    }

    blinkTimer.current -= delta;
    if (blinkTimer.current <= 0) {
      blinkState.current = 1;
      blinkTimer.current = Math.random() * 4 + 3;
    }
    if (blinkState.current > 0) {
      blinkState.current -= delta * 9;
      if (blinkState.current < 0) blinkState.current = 0;
    }
    const eyeScaleY = blinkState.current > 0 ? Math.max(0.05, 1 - blinkState.current * 2) : 1;
    if (leftEyeRef.current) leftEyeRef.current.scale.y = eyeScaleY;
    if (rightEyeRef.current) rightEyeRef.current.scale.y = eyeScaleY;
  });

  return (
    <Float speed={1.2} rotationIntensity={0.05} floatIntensity={0.1}>
      <group ref={groupRef} position={[0, -0.2, 0]}>
        <group ref={bodyRef}>
          {}
          <mesh position={[0, 0.1, 0]} castShadow>
            <boxGeometry args={[0.72, 0.95, 0.37]} />
            <meshStandardMaterial color={suitColor} roughness={0.5} metalness={0.1} />
          </mesh>
          {}
          <mesh position={[-0.12, 0.42, 0.19]} rotation={[0, 0, 0.3]}>
            <boxGeometry args={[0.12, 0.28, 0.02]} />
            <meshStandardMaterial color={accentColor} />
          </mesh>
          <mesh position={[0.12, 0.42, 0.19]} rotation={[0, 0, -0.3]}>
            <boxGeometry args={[0.12, 0.28, 0.02]} />
            <meshStandardMaterial color={accentColor} />
          </mesh>
          {}
          <mesh position={[0, 0.36, 0.19]}>
            <boxGeometry args={[0.2, 0.35, 0.02]} />
            <meshStandardMaterial color="#FFFFFF" roughness={0.9} />
          </mesh>
          {}
          <mesh position={[0, 0.28, 0.2]}>
            <boxGeometry args={[0.065, 0.38, 0.02]} />
            <meshStandardMaterial color={tieColor} roughness={0.7} />
          </mesh>
          {}
          <mesh position={[0, 0.49, 0.2]}>
            <boxGeometry args={[0.07, 0.07, 0.025]} />
            <meshStandardMaterial color={tieColor} />
          </mesh>
          {}
          <mesh position={[-0.28, 0.38, 0.19]}>
            <boxGeometry args={[0.07, 0.05, 0.015]} />
            <meshStandardMaterial color="#FFD700" metalness={0.2} />
          </mesh>

          {}
          {([-0.44, 0.44] as number[]).map((x, i) => (
            <mesh key={i} position={[x, 0.42, 0]} castShadow>
              <sphereGeometry args={[0.13, 16, 16]} />
              <meshStandardMaterial color={suitColor} roughness={0.5} />
            </mesh>
          ))}

          {}
          <group ref={leftArmRef} position={[-0.48, 0.12, 0]}>
            <mesh rotation={[0, 0, 0.15]} castShadow>
              <cylinderGeometry args={[0.065, 0.055, 0.55, 12]} />
              <meshStandardMaterial color={suitColor} roughness={0.5} />
            </mesh>
            <mesh position={[0, -0.32, 0]}>
              <sphereGeometry args={[0.065, 12, 12]} />
              <meshStandardMaterial color={skinColor} roughness={0.6} />
            </mesh>
          </group>
          <group ref={rightArmRef} position={[0.48, 0.12, 0]}>
            <mesh rotation={[0, 0, -0.15]} castShadow>
              <cylinderGeometry args={[0.065, 0.055, 0.55, 12]} />
              <meshStandardMaterial color={suitColor} roughness={0.5} />
            </mesh>
            <mesh position={[0, -0.32, 0]}>
              <sphereGeometry args={[0.065, 12, 12]} />
              <meshStandardMaterial color={skinColor} roughness={0.6} />
            </mesh>
          </group>

          {}
          <mesh position={[0, 0.63, 0]} castShadow>
            <cylinderGeometry args={[0.085, 0.1, 0.16, 16]} />
            <meshStandardMaterial color={skinColor} roughness={0.6} />
          </mesh>

          {}
          <group ref={headRef} position={[0, 0.98, 0]}>
            {}
            <mesh castShadow>
              <sphereGeometry args={[0.27, 32, 32]} />
              <meshStandardMaterial color={skinColor} roughness={0.45} />
            </mesh>
            {}
            <mesh position={[0, 0.14, -0.02]}>
              <sphereGeometry args={[0.275, 32, 32, 0, Math.PI * 2, 0, Math.PI * 0.48]} />
              <meshStandardMaterial color={hairColor} roughness={0.9} />
            </mesh>
            {}
            <mesh position={[-0.22, 0.02, 0]} rotation={[0, 0, 0.5]}>
              <cylinderGeometry args={[0.07, 0.04, 0.18, 8]} />
              <meshStandardMaterial color={hairColor} roughness={0.9} />
            </mesh>
            <mesh position={[0.22, 0.02, 0]} rotation={[0, 0, -0.5]}>
              <cylinderGeometry args={[0.07, 0.04, 0.18, 8]} />
              <meshStandardMaterial color={hairColor} roughness={0.9} />
            </mesh>

            {}
            <mesh ref={leftEyeRef} position={[-0.09, 0.04, 0.24]}>
              <sphereGeometry args={[0.038, 16, 16]} />
              <meshStandardMaterial color="#FFFFFF" roughness={0.1} />
            </mesh>
            <mesh ref={rightEyeRef} position={[0.09, 0.04, 0.24]}>
              <sphereGeometry args={[0.038, 16, 16]} />
              <meshStandardMaterial color="#FFFFFF" roughness={0.1} />
            </mesh>
            {}
            <mesh position={[-0.09, 0.04, 0.27]}>
              <sphereGeometry args={[0.019, 12, 12]} />
              <meshStandardMaterial color="#0D1B2A" />
            </mesh>
            <mesh position={[0.09, 0.04, 0.27]}>
              <sphereGeometry args={[0.019, 12, 12]} />
              <meshStandardMaterial color="#0D1B2A" />
            </mesh>
            {}
            <mesh position={[-0.086, 0.046, 0.285]}>
              <sphereGeometry args={[0.006]} />
              <meshStandardMaterial color="#FFFFFF" emissive="#FFFFFF" emissiveIntensity={1} />
            </mesh>
            <mesh position={[0.094, 0.046, 0.285]}>
              <sphereGeometry args={[0.006]} />
              <meshStandardMaterial color="#FFFFFF" emissive="#FFFFFF" emissiveIntensity={1} />
            </mesh>
            {}
            <mesh position={[-0.09, 0.1, 0.24]} rotation={[0, 0, animation === 'thinking' ? 0.3 : 0.12]}>
              <boxGeometry args={[0.07, 0.012, 0.01]} />
              <meshStandardMaterial color={hairColor} />
            </mesh>
            <mesh position={[0.09, 0.1, 0.24]} rotation={[0, 0, animation === 'thinking' ? -0.3 : -0.12]}>
              <boxGeometry args={[0.07, 0.012, 0.01]} />
              <meshStandardMaterial color={hairColor} />
            </mesh>
            {}
            <mesh position={[0, -0.015, 0.265]} rotation={[Math.PI * 0.55, 0, 0]}>
              <coneGeometry args={[0.02, 0.045, 6]} />
              <meshStandardMaterial color={skinColor} roughness={0.5} />
            </mesh>
            {}
            <mesh ref={mouthRef} position={[0, -0.095, 0.245]}>
              <boxGeometry args={[0.085, 0.022, 0.02]} />
              <meshStandardMaterial color="#B06070" roughness={0.5} />
            </mesh>
            {}
            <mesh position={[-0.27, 0, 0]}>
              <sphereGeometry args={[0.042, 10, 10]} />
              <meshStandardMaterial color={skinColor} roughness={0.6} />
            </mesh>
            <mesh position={[0.27, 0, 0]}>
              <sphereGeometry args={[0.042, 10, 10]} />
              <meshStandardMaterial color={skinColor} roughness={0.6} />
            </mesh>
            {}
            <mesh position={[-0.09, 0.04, 0.28]} rotation={[0, 0, 0]}>
              <torusGeometry args={[0.045, 0.006, 8, 24]} />
              <meshStandardMaterial color="#222" metalness={0.9} roughness={0.1} />
            </mesh>
            <mesh position={[0.09, 0.04, 0.28]}>
              <torusGeometry args={[0.045, 0.006, 8, 24]} />
              <meshStandardMaterial color="#222" metalness={0.9} roughness={0.1} />
            </mesh>
            <mesh position={[0, 0.04, 0.28]}>
              <boxGeometry args={[0.04, 0.006, 0.003]} />
              <meshStandardMaterial color="#222" metalness={0.9} />
            </mesh>
          </group>
        </group>
      </group>
    </Float>
  );
}
