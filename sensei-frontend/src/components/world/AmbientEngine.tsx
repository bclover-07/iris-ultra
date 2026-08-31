'use client';

import { useMemo, useRef, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Sky } from '@react-three/drei';

type WeatherState = 'sunny' | 'sunset' | 'night' | 'rain' | 'storm';

interface AmbientEngineProps {
  weatherOverride?: WeatherState;
  crowdDensity?: 'low' | 'medium' | 'high';
}

export default function AmbientEngine({ weatherOverride, crowdDensity }: AmbientEngineProps) {
  const [weather, setWeather] = useState<WeatherState>('sunny');
  const [time, setTime] = useState(0);


  useEffect(() => {
    if (weatherOverride) {
      setWeather(weatherOverride);
      return;
    }
    const interval = setInterval(() => {
      setWeather(w => {
        if (w === 'sunny') return 'sunset';
        if (w === 'sunset') return 'night';
        if (w === 'night') return 'rain';
        return 'sunny';
      });
    }, 60000);
    return () => clearInterval(interval);
  }, [weatherOverride]);


  const transitionSpeed = weather === 'storm' ? 0.05 : 0.01;
  const crowdBonus = crowdDensity === 'high' ? 0.6 : crowdDensity === 'medium' ? 0.3 : 0;
  
  const currentEnv = useRef({
    sunPosition: new THREE.Vector3(40, 30, -20),
    ambientIntensity: 0.9,
    directionalIntensity: 1.2,
    skyColor: new THREE.Color('#87CEEB'),
    fogColor: new THREE.Color('#87CEEB'),
    fogDensity: 0.01,
  });

  const targetEnv = useMemo(() => {
    switch (weather) {
      case 'sunset':
        return {
          sunPosition: new THREE.Vector3(40, 5, -20),
          ambientIntensity: 0.5,
          directionalIntensity: 0.8,
          skyColor: new THREE.Color('#FF7E67'),
          fogColor: new THREE.Color('#FF7E67'),
          fogDensity: 0.015,
        };
      case 'night':
        return {
          sunPosition: new THREE.Vector3(40, -10, -20),
          ambientIntensity: 0.1,
          directionalIntensity: 0.0,
          skyColor: new THREE.Color('#0A0A2A'),
          fogColor: new THREE.Color('#0A0A2A'),
          fogDensity: 0.02,
        };
      case 'rain':
        return {
          sunPosition: new THREE.Vector3(40, 30, -20),
          ambientIntensity: 0.3,
          directionalIntensity: 0.4,
          skyColor: new THREE.Color('#4A5568'),
          fogColor: new THREE.Color('#4A5568'),
          fogDensity: 0.03,
        };
      case 'storm':
        return {
          sunPosition: new THREE.Vector3(40, 40, -20),
          ambientIntensity: 0.2,
          directionalIntensity: 0.1,
          skyColor: new THREE.Color('#1A1A1A'),
          fogColor: new THREE.Color('#8B0000'),
          fogDensity: 0.05,
        };
      default:
        return {
          sunPosition: new THREE.Vector3(40, 30, -20),
          ambientIntensity: 0.9,
          directionalIntensity: 1.2,
          skyColor: new THREE.Color('#87CEEB'),
          fogColor: new THREE.Color('#87CEEB'),
          fogDensity: 0.01,
        };
    }
  }, [weather]);

  const dirLightRef = useRef<THREE.DirectionalLight>(null);
  const ambLightRef = useRef<THREE.AmbientLight>(null);
  const hemiLightRef = useRef<THREE.HemisphereLight>(null);

  useFrame((state) => {

    const cur = currentEnv.current;
    const tgt = targetEnv;
    
    cur.sunPosition.lerp(tgt.sunPosition, transitionSpeed);
    cur.ambientIntensity = THREE.MathUtils.lerp(cur.ambientIntensity, tgt.ambientIntensity + crowdBonus, transitionSpeed);
    cur.directionalIntensity = THREE.MathUtils.lerp(cur.directionalIntensity, tgt.directionalIntensity + (crowdBonus * 0.5), transitionSpeed);
    cur.skyColor.lerp(tgt.skyColor, transitionSpeed);
    cur.fogColor.lerp(tgt.fogColor, transitionSpeed);
    cur.fogDensity = THREE.MathUtils.lerp(cur.fogDensity, tgt.fogDensity, transitionSpeed);

    if (dirLightRef.current) {
      dirLightRef.current.position.copy(cur.sunPosition);
      dirLightRef.current.intensity = cur.directionalIntensity;
    }
    if (ambLightRef.current) {
      ambLightRef.current.intensity = cur.ambientIntensity;
    }
    if (hemiLightRef.current) {
      hemiLightRef.current.color.copy(cur.skyColor);
    }

    state.scene.background = cur.skyColor;
    if (state.scene.fog) {
      (state.scene.fog as THREE.FogExp2).color.copy(cur.fogColor);
      (state.scene.fog as THREE.FogExp2).density = cur.fogDensity;
    }
  });

  return (
    <>
      <ambientLight ref={ambLightRef} color="#FFF8E1" intensity={0.9} />
      <directionalLight
        ref={dirLightRef}
        position={[40, 30, -20]}
        intensity={1.2}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-camera-far={60}
        shadow-camera-left={-30}
        shadow-camera-right={30}
        shadow-camera-top={30}
        shadow-camera-bottom={-30}
      />
      <hemisphereLight ref={hemiLightRef} color="#87CEEB" groundColor="#7BC67E" intensity={0.3} />
      
      <fogExp2 attach="fog" color="#87CEEB" density={0.01} />

      {(weather === 'rain' || weather === 'storm') && <RainParticles />}
      {weather === 'night' && <Fireflies />}
      {(weather === 'night' || crowdDensity === 'high') && <Stars />}
    </>
  );
}

function RainParticles() {
  const count = 1000;
  const meshRef = useRef<THREE.InstancedMesh>(null);
  
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const speeds = useMemo(() => new Float32Array(count), []);

  useEffect(() => {
    if (!meshRef.current) return;
    for (let i = 0; i < count; i++) {
      dummy.position.set(
        (Math.random() - 0.5) * 60,
        Math.random() * 40,
        (Math.random() - 0.5) * 60
      );
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
      speeds[i] = 10 + Math.random() * 5;
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
  }, [dummy, speeds]);

  useFrame((state, delta) => {
    if (!meshRef.current) return;
    for (let i = 0; i < count; i++) {
      meshRef.current.getMatrixAt(i, dummy.matrix);
      dummy.position.setFromMatrixPosition(dummy.matrix);
      
      dummy.position.y -= speeds[i] * delta;
      dummy.position.x -= 2 * delta;

      if (dummy.position.y < 0) {
        dummy.position.y = 40;
        dummy.position.x = (Math.random() - 0.5) * 60;
      }

      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
      <boxGeometry args={[0.02, 0.5, 0.02]} />
      <meshBasicMaterial color="#A0C4FF" transparent opacity={0.4} />
    </instancedMesh>
  );
}

function Fireflies() {
  const count = 50;
  const meshRef = useRef<THREE.InstancedMesh>(null);
  
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const phases = useMemo(() => new Float32Array(count), []);
  const basePositions = useMemo(() => new Float32Array(count * 3), []);

  useEffect(() => {
    if (!meshRef.current) return;
    for (let i = 0; i < count; i++) {
      const x = (Math.random() - 0.5) * 40;
      const y = 0.5 + Math.random() * 3;
      const z = (Math.random() - 0.5) * 40;
      basePositions[i*3] = x;
      basePositions[i*3+1] = y;
      basePositions[i*3+2] = z;
      phases[i] = Math.random() * Math.PI * 2;
      
      dummy.position.set(x,y,z);
      dummy.scale.setScalar(Math.random() * 0.5 + 0.5);
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
  }, [basePositions, dummy, phases]);

  useFrame((state, delta) => {
    if (!meshRef.current) return;
    const time = state.clock.elapsedTime;
    for (let i = 0; i < count; i++) {
      meshRef.current.getMatrixAt(i, dummy.matrix);
      dummy.position.setFromMatrixPosition(dummy.matrix);
      
      const px = basePositions[i*3];
      const py = basePositions[i*3+1];
      const pz = basePositions[i*3+2];
      const p = phases[i];

      dummy.position.x = px + Math.sin(time * 0.5 + p) * 2;
      dummy.position.y = py + Math.cos(time * 0.3 + p) * 1;
      dummy.position.z = pz + Math.sin(time * 0.4 + p) * 2;
      
      const scale = (Math.sin(time * 2 + p) + 1) * 0.5 + 0.5;
      dummy.scale.setScalar(scale);

      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
      <sphereGeometry args={[0.05, 8, 8]} />
      <meshBasicMaterial color="#E2F516" toneMapped={false} />
    </instancedMesh>
  );
}

function Stars() {
  const count = 300;
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  useEffect(() => {
    if (!meshRef.current) return;
    for (let i = 0; i < count; i++) {
      const radius = 40 + Math.random() * 20;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos((Math.random() * 2) - 1);
      
      dummy.position.x = radius * Math.sin(phi) * Math.cos(theta);
      dummy.position.y = Math.abs(radius * Math.sin(phi) * Math.sin(theta));
      dummy.position.z = radius * Math.cos(phi);
      
      dummy.scale.setScalar(Math.random() * 0.5 + 0.5);
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
  }, [dummy]);

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
      <sphereGeometry args={[0.1, 4, 4]} />
      <meshBasicMaterial color="#FFFFFF" transparent opacity={0.8} />
    </instancedMesh>
  );
}
