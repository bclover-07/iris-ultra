'use client';

import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Environment, useGLTF, useAnimations } from '@react-three/drei';
import { Suspense, useRef, useMemo, useEffect, useState } from 'react';
import * as THREE from 'three';

interface AvatarProps {
  mood: 'idle' | 'thinking' | 'talking' | 'happy' | 'waving' | 'sad' | 'confused';
}

function CustomAvatar({ mood }: AvatarProps) {
  const group = useRef<THREE.Group>(null);
  const { scene, animations } = useGLTF('/images/models/model.glb');
  const { actions, names } = useAnimations(animations, group);

  const [activeAnim, setActiveAnim] = useState<string | null>(null);

  // Parse and store references to bones and ALL facial meshes
  const { bones, faceMeshes, morphDict } = useMemo(() => {
    const b: Record<string, THREE.Bone> = {};
    const fMeshes: THREE.SkinnedMesh[] = [];
    const dict: Record<string, { mesh: THREE.SkinnedMesh, index: number }> = {};
    
    scene.traverse((child: any) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
        if (child.morphTargetDictionary) {
          fMeshes.push(child);
          Object.entries(child.morphTargetDictionary).forEach(([key, val]) => {
            dict[key] = { mesh: child, index: val as number };
          });
        }
      }
      if (child.isBone) {
        // Standardize bone names to lowercase for robust matching
        b[child.name.toLowerCase()] = child;
      }
    });

    return { bones: b, faceMeshes: fMeshes, morphDict: dict };
  }, [scene]);

  // Map requested visemes and expressions to whatever the model actually uses
  const { visemeMap, expressionMap } = useMemo(() => {
    const vMap: Record<string, { mesh: THREE.SkinnedMesh, index: number } | null> = {};
    const eMap: Record<string, { mesh: THREE.SkinnedMesh, index: number } | null> = {};

    if (!morphDict) return { visemeMap: vMap, expressionMap: eMap };

    const findMorph = (keywords: string[]) => {
      for (const kw of keywords) {
        for (const key in morphDict) {
          if (key.toLowerCase().includes(kw)) return morphDict[key];
        }
      }
      return null;
    };

    // Visemes: A, E, I, O, U, F/V, L, M/B/P, W/Q
    vMap['A'] = findMorph(['aa', 'mth_a', 'mouth_a', 'moutha', 'viseme_a', 'mouthopen', 'jawopen']);
    vMap['E'] = findMorph(['ee', 'mth_e', 'mouth_e', 'mouthe', 'viseme_e', 'mouthsmile']);
    vMap['I'] = findMorph(['ih', 'mth_i', 'mouth_i', 'mouthi', 'viseme_i']);
    vMap['O'] = findMorph(['oh', 'mth_o', 'mouth_o', 'moutho', 'viseme_o', 'mouthfunnel']);
    vMap['U'] = findMorph(['ou', 'mth_u', 'mouth_u', 'mouthu', 'viseme_u', 'mouthpucker']);
    vMap['FV'] = findMorph(['ff', 'mth_v', 'mouth_v', 'viseme_ff', 'viseme_v']);
    vMap['L'] = findMorph(['nn', 'mth_l', 'mouth_l', 'viseme_nn', 'viseme_l', 'tongue']);
    vMap['MBP'] = findMorph(['pp', 'mth_p', 'mouth_p', 'mouthclosed', 'viseme_pp', 'viseme_m']);
    vMap['WQ'] = findMorph(['rr', 'mth_w', 'mouth_w', 'viseme_rr', 'viseme_w']);

    // Expressions
    eMap['blink_l'] = findMorph(['blink_l', 'eye_close_l', 'eyeblinkleft']);
    eMap['blink_r'] = findMorph(['blink_r', 'eye_close_r', 'eyeblinkright']);
    eMap['blink'] = findMorph(['blink', 'eye_close', 'close', 'eyesclosed']);
    
    eMap['happy'] = findMorph(['joy', 'smile', 'happy', 'fun', 'mouthsmile']);
    eMap['sad'] = findMorph(['sorrow', 'sad', 'frown', 'mouthfrown']);
    eMap['confused'] = findMorph(['surprised', 'confused', 'shock', 'browsup']);
    eMap['thinking'] = findMorph(['natural', 'neutral']);

    return { visemeMap: vMap, expressionMap: eMap };
  }, [morphDict]);

  // GLTF Animation State Machine
  useEffect(() => {
    if (names.length > 0) {
      const matchers: Record<string, string[]> = {
        idle: ['idle', 'breath', 'stand'],
        talking: ['talk', 'speak', 'explain'],
        thinking: ['think', 'ponder'],
        happy: ['happy', 'joy', 'excited', 'laugh'],
        waving: ['wave', 'greet', 'hi'],
        sad: ['sad', 'sorrow', 'cry'],
        confused: ['confuse', 'surprise', 'shrug'],
      };

      let targetAnim = null;
      const keywords = matchers[mood] || [];
      
      for (const kw of keywords) {
        targetAnim = names.find(n => n.toLowerCase().includes(kw));
        if (targetAnim) break;
      }
      
      // ONLY fallback to idle if the mood is actually idle!
      // This prevents static idle animations from overriding our procedural talking/waving
      if (!targetAnim && mood === 'idle') {
        targetAnim = names.find(n => n.toLowerCase().includes('idle')) || names[0];
      }

      if (targetAnim && actions[targetAnim]) {
        actions[targetAnim]?.reset().fadeIn(0.4).play();
        setActiveAnim(targetAnim);
        return () => { actions[targetAnim]?.fadeOut(0.4); };
      }
    }
    setActiveAnim(null);
  }, [mood, actions, names]);

  // State refs for procedural animations and morphs
  const blinkRef = useRef({ val: 0, target: 0, timer: 0 });
  const lipSyncRef = useRef({ currentViseme: '', timer: 0 });
  
  // Track target morph values so we can lerp them
  // Key format: `${mesh.uuid}_${index}`
  const emotionRef = useRef<Record<string, { mesh: THREE.SkinnedMesh, index: number, target: number }>>({});

  useFrame((state, delta) => {
    if (!group.current) return;
    const t = state.clock.getElapsedTime();

    // --------------------------------------------------------
    // 1. BLINKING, FACIAL EXPRESSIONS & LIP-SYNC (MORPH TARGETS)
    // --------------------------------------------------------
    
    // We will track target values for ONLY the morphs we explicitly control
    const morphTargets = new Map<{mesh: THREE.SkinnedMesh, index: number}, number>();
    
    const setMorph = (morph: { mesh: THREE.SkinnedMesh, index: number } | null, value: number) => {
      if (morph) morphTargets.set(morph, value);
    };

    // Initialize all mapped morphs to 0
    Object.values(visemeMap).forEach(m => setMorph(m, 0));
    Object.values(expressionMap).forEach(m => setMorph(m, 0));

    // Blinking logic
    blinkRef.current.timer -= delta;
    if (blinkRef.current.timer <= 0) {
      if (blinkRef.current.target === 0) {
        blinkRef.current.target = 1; // Close eye
        blinkRef.current.timer = 0.1; // 100ms blink
      } else {
        blinkRef.current.target = 0; // Open eye
        blinkRef.current.timer = Math.random() * 3 + 2;
      }
    }
    blinkRef.current.val = THREE.MathUtils.lerp(blinkRef.current.val, blinkRef.current.target, delta * 30);
    
    setMorph(expressionMap['blink'], blinkRef.current.val);
    setMorph(expressionMap['blink_l'], blinkRef.current.val);
    setMorph(expressionMap['blink_r'], blinkRef.current.val);

    // Lip-sync / Talking Visemes
    if (mood === 'talking') {
      lipSyncRef.current.timer -= delta;
      if (lipSyncRef.current.timer <= 0) {
        const visemes = ['A', 'E', 'I', 'O', 'U', 'FV', 'L', 'MBP', 'WQ', 'None'];
        lipSyncRef.current.currentViseme = visemes[Math.floor(Math.random() * visemes.length)];
        lipSyncRef.current.timer = Math.random() * 0.1 + 0.05; // Change viseme quickly
      }
      const vKey = lipSyncRef.current.currentViseme;
      if (vKey !== 'None' && visemeMap[vKey]) {
        setMorph(visemeMap[vKey], 1.0);
      }
    }

    // Emotion states
    if (mood === 'happy') setMorph(expressionMap['happy'], 0.8);
    else if (mood === 'thinking') setMorph(expressionMap['thinking'], 0.6);
    else if (mood === 'sad') setMorph(expressionMap['sad'], 0.8);
    else if (mood === 'confused') setMorph(expressionMap['confused'], 0.7);
    else if (mood === 'waving') setMorph(expressionMap['happy'], 0.6);

    // Smoothly apply our mapped morph targets without affecting unmapped ones
    morphTargets.forEach((targetValue, morph) => {
      if (morph && morph.mesh.morphTargetInfluences) {
        morph.mesh.morphTargetInfluences[morph.index] = THREE.MathUtils.lerp(
          morph.mesh.morphTargetInfluences[morph.index], 
          targetValue, 
          delta * 15
        );
      }
    });

    // Jaw Fallback Animation (in case visemes don't exist, we still want jaw movement)
    const jawBone = Object.values(bones).find(b => b.name.toLowerCase().includes('jaw') || b.name.toLowerCase().includes('mouth'));
    if (jawBone) {
      if (mood === 'talking') {
        const targetJawOpen = (Math.sin(t * 15) > 0) ? 0.2 : 0;
        // Rotate on X and Z to cover different rigging standards
        jawBone.rotation.x = THREE.MathUtils.lerp(jawBone.rotation.x, targetJawOpen, delta * 20);
        jawBone.rotation.z = THREE.MathUtils.lerp(jawBone.rotation.z, targetJawOpen * 0.5, delta * 20);
      } else {
        jawBone.rotation.x = THREE.MathUtils.lerp(jawBone.rotation.x, 0, delta * 10);
        jawBone.rotation.z = THREE.MathUtils.lerp(jawBone.rotation.z, 0, delta * 10);
      }
    }

    // --------------------------------------------------------
    // 2. PROCEDURAL BONE ANIMATIONS (Continuous Movement)
    // --------------------------------------------------------
    
    const getBone = (names: string[]) => {
      for (const n of names) {
        const found = Object.keys(bones).find(k => k.includes(n.toLowerCase()));
        if (found) return bones[found];
      }
      return undefined;
    };

    const spine = getBone(['spine', 'chest']);
    const neck = getBone(['neck']);
    const head = getBone(['head']);
    const lArm = getBone(['l_upperarm', 'leftarm', 'left_arm', 'shoulder.l']);
    const rArm = getBone(['r_upperarm', 'rightarm', 'right_arm', 'shoulder.r']);
    const lForeArm = getBone(['l_lowerarm', 'leftforearm', 'left_forearm']);
    const rForeArm = getBone(['r_lowerarm', 'rightforearm', 'right_forearm']);
    const rHand = getBone(['r_hand', 'righthand']);

    // Eye Tracking
    const lookPitch = state.mouse.y * 0.2; 
    const lookYaw = -state.mouse.x * 0.4;

    if (head && neck) {
      head.rotation.y = THREE.MathUtils.lerp(head.rotation.y, lookYaw * 0.4, delta * 5);
      head.rotation.x = THREE.MathUtils.lerp(head.rotation.x, -lookPitch * 0.5, delta * 5);
      neck.rotation.y = THREE.MathUtils.lerp(neck.rotation.y, lookYaw * 0.2, delta * 5);
      neck.rotation.x = THREE.MathUtils.lerp(neck.rotation.x, -lookPitch * 0.2, delta * 5);
    }

    // If no specific GLTF animation is overriding us, apply continuous procedural gestures
    if (!activeAnim) {
      const targetRot = {
        // Bend spine slightly forward (x) to fix puffed out chest, counter with neck
        spine: new THREE.Euler(0.15, 0, 0),
        neck: new THREE.Euler(-0.1, 0, 0),
        head: new THREE.Euler(0, 0, 0),
        // Drop arms straight down. Add slight x rotation if they default to swinging backward
        lArm: new THREE.Euler(0.1, 0, -1.2), 
        rArm: new THREE.Euler(0.1, 0, 1.2),
        // Keep forearms perfectly straight
        lForeArm: new THREE.Euler(0, 0, 0),
        rForeArm: new THREE.Euler(0, 0, 0),
        rHand: new THREE.Euler(0, 0, 0),
      };

      // Continuous breathing / subtle movement
      const breath = Math.sin(t * 1.5) * 0.01;
      targetRot.spine.x += breath; // reduced breath exaggeration

      // Track look-at
      targetRot.head.y += lookYaw * 0.4;
      targetRot.head.x -= lookPitch * 0.5;
      targetRot.neck.y += lookYaw * 0.2;
      targetRot.neck.x -= lookPitch * 0.2;

      if (mood === 'idle') {
        targetRot.neck.y += Math.sin(t * 0.5) * 0.1;
        targetRot.head.x += Math.sin(t * 0.7) * 0.05;
        targetRot.spine.y += Math.sin(t * 0.3) * 0.05;
      } else if (mood === 'talking') {
        // Only move head slightly while talking, arms stay frozen in natural pose
        targetRot.head.x += Math.sin(t * 5) * 0.03;
        targetRot.neck.y += Math.sin(t * 2) * 0.05;
      } else if (mood === 'thinking') {
        targetRot.head.x -= 0.1;
        targetRot.head.y -= 0.2;
      } else if (mood === 'waving') {
        targetRot.head.z = -0.1;
      } else if (mood === 'happy') {
        targetRot.head.x += Math.sin(t * 6) * 0.05;
      }

      const lerpRot = (bone: THREE.Bone | undefined, target: THREE.Euler, speed: number = 6) => {
        if (!bone) return;
        const q = new THREE.Quaternion().setFromEuler(target);
        bone.quaternion.slerp(q, delta * speed);
      };

      lerpRot(spine, targetRot.spine);
      lerpRot(neck, targetRot.neck);
      lerpRot(head, targetRot.head);
      lerpRot(lArm, targetRot.lArm);
      lerpRot(rArm, targetRot.rArm);
      lerpRot(lForeArm, targetRot.lForeArm);
      lerpRot(rForeArm, targetRot.rForeArm);
      lerpRot(rHand, targetRot.rHand);
    }

    // Global bounce
    if (mood === 'happy') {
      group.current.position.y = THREE.MathUtils.lerp(
        group.current.position.y,
        -1.55 + Math.abs(Math.sin(t * 5)) * 0.06,
        delta * 10
      );
    } else {
      group.current.position.y = THREE.MathUtils.lerp(group.current.position.y, -1.55 + Math.sin(t * 1.5) * 0.01, delta * 5);
      group.current.position.x = THREE.MathUtils.lerp(group.current.position.x, 0, delta * 2);
    }
  });

  return (
    <group ref={group} position={[0, -1.55, 0]} scale={1.6} rotation={[0, 0, 0]}>
      <primitive object={scene} />
    </group>
  );
}

function FloatingParticles() {
  const particlesRef = useRef<THREE.Points>(null);

  const { positions, colors } = useMemo(() => {
    const count = 50;
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);
    const palette = [
      [0.55, 0.36, 0.96],
      [1, 0.84, 0],
      [0, 0.9, 1],
      [1, 0.4, 0.6],
    ];

    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 6;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 4;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 4;

      const c = palette[Math.floor(Math.random() * palette.length)];
      col[i * 3] = c[0];
      col[i * 3 + 1] = c[1];
      col[i * 3 + 2] = c[2];
    }

    return { positions: pos, colors: col };
  }, []);

  useFrame((state) => {
    if (particlesRef.current) {
      particlesRef.current.rotation.y = state.clock.getElapsedTime() * 0.03;
    }
  });

  return (
    <points ref={particlesRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={positions.length / 3} array={positions} itemSize={3} />
        <bufferAttribute attach="attributes-color" count={colors.length / 3} array={colors} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial size={0.04} vertexColors transparent opacity={0.5} sizeAttenuation />
    </points>
  );
}

function Platform() {
  return (
    <group position={[0, -1.55, 0]}>
      <mesh receiveShadow>
        <cylinderGeometry args={[1.0, 1.1, 0.08, 32]} />
        <meshStandardMaterial color="#8B5CF6" roughness={0.4} metalness={0.3} />
      </mesh>
      <mesh position={[0, -0.05, 0]}>
        <cylinderGeometry args={[1.15, 1.2, 0.04, 32]} />
        <meshStandardMaterial color="#FFD700" roughness={0.3} metalness={0.5} />
      </mesh>
    </group>
  );
}

export default function Avatar3DScene({ mood }: AvatarProps) {
  return (
    <Canvas
      shadows
      camera={{ position: [0, 0.3, 5.5], fov: 45 }}
      style={{ width: '100%', height: '100%' }}
      gl={{ antialias: true, alpha: true }}
    >
      <Suspense fallback={null}>
        <ambientLight intensity={0.7} />
        <directionalLight
          position={[3, 5, 3]}
          intensity={1.5}
          castShadow
          color="#fff5ee"
          shadow-mapSize-width={1024}
          shadow-mapSize-height={1024}
        />
        <directionalLight position={[-2, 3, -1]} intensity={0.3} color="#b3a0ff" />
        <pointLight position={[0, 2, 2]} intensity={0.6} color="#FFD700" />

        <Environment preset="city" />

        <CustomAvatar mood={mood} />

        <Platform />
        <FloatingParticles />

        <OrbitControls
          enableZoom={false}
          enablePan={false}
          minPolarAngle={Math.PI / 4}
          maxPolarAngle={Math.PI / 2.2}
          target={[0, -0.6, 0]}
          autoRotate={false}
        />
      </Suspense>
    </Canvas>
  );
}

useGLTF.preload('/images/models/model.glb');
