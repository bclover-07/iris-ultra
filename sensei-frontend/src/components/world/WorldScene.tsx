'use client';

import { useRef, useMemo, useEffect, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Html, Float, MeshDistortMaterial, PointMaterial } from '@react-three/drei';
import { motion, AnimatePresence } from 'framer-motion';
import * as THREE from 'three';
import AmbientEngine from './AmbientEngine';
import NpcSystem from './NpcSystem';

interface Player {
  userId: string;
  username: string;
  avatar: string;
  position: { x: number; y: number; z: number };
  rotation: { y: number };
  animation: string;
}

interface WorldSceneProps {
  players: Player[];
  npcs?: any[];
  myUserId: string;
  onMove: (position: any, rotation: any, animation: string) => void;
  joystickMove?: { x: number, y: number } | null;
  jumpTrigger?: number;
  talkingUsers?: Set<string>;
  reactions?: Record<string, string>;
  playerMessages?: Record<string, string>;
  weatherOverride?: 'sunny' | 'sunset' | 'night' | 'rain' | 'storm';
  leaderboard?: any[];
  hideUI?: boolean;
  chaosEvent?: { type: string, duration: number } | null;
  crowdState?: { density: string, playerCount: number };
  knockbackTrigger?: { x: number, y: number, z: number, id: number } | null;
}


function SpeakingStatue({ position, name, color }: { position: [number, number, number], name: string, color: string }) {
  const [msg, setMsg] = useState<string | null>(null);
  const speak = () => {
    const quotes = ["Knowledge is power.", "Keep studying!", "The stars align for those who learn."];
    setMsg(quotes[Math.floor(Math.random() * quotes.length)]);
    setTimeout(() => setMsg(null), 3000);
  };
  return (
    <group position={position}>
      <mesh castShadow position={[0, 2, 0]} onClick={speak}>
        <boxGeometry args={[1, 3, 1]} />
        <meshToonMaterial color={color} />
      </mesh>
      <mesh castShadow position={[0, 0.5, 0]}>
        <boxGeometry args={[1.5, 1, 1.5]} />
        <meshToonMaterial color="#444" />
      </mesh>
      <Html position={[0, 4, 0]} center>
        <AnimatePresence>
          {msg && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              style={{ background: 'white', padding: '8px 16px', borderRadius: 16, border: `3px solid ${color}`, fontWeight: 700, whiteSpace: 'nowrap', boxShadow: '0 4px 15px rgba(0,0,0,0.2)' }}>
              "{msg}" — {name}
            </motion.div>
          )}
        </AnimatePresence>
      </Html>
    </group>
  );
}

function HallOfFame({ leaderboard }: { leaderboard: any[] }) {
  return (
    <group position={[0, 0, -45]}>
      <mesh receiveShadow>
        <boxGeometry args={[20, 0.5, 10]} />
        <meshToonMaterial color="#263238" />
      </mesh>
      <Html position={[0, 5, 0]} center>
        <h2 style={{ color: '#FFD93D', fontFamily: 'Fredoka', fontSize: 20 }}>👑 TOP ACHIEVERS</h2>
      </Html>
      {leaderboard.slice(0, 3).map((p, i) => (
        <group key={p.userId} position={[(i - 1) * 5, 0.25, 0]}>
          <mesh castShadow>
            <cylinderGeometry args={[1, 1, i === 0 ? 3 : i === 1 ? 2 : 1.5]} />
            <meshToonMaterial color={i === 0 ? "#FFD700" : i === 1 ? "#C0C0C0" : "#CD7F32"} />
          </mesh>
          <Html position={[0, i === 0 ? 3.5 : i === 1 ? 2.5 : 2, 0]} center>
            <div style={{ background: 'rgba(0,0,0,0.8)', padding: '5px 10px', borderRadius: 10, color: 'white', whiteSpace: 'nowrap' }}>
              #{i+1} {p.username}
            </div>
          </Html>
        </group>
      ))}
    </group>
  );
}

function FloatingIsland({ position, chaosType }: { position: [number, number, number], chaosType?: string }) {
  return (
    <Float speed={2} rotationIntensity={0.5} floatIntensity={1}>
      <group position={position}>
        <mesh receiveShadow castShadow>
          <cylinderGeometry args={[4, 5, 2, 8]} />
          <meshToonMaterial color={chaosType === 'Darkness Mode' ? '#222' : "#5D4037"} />
        </mesh>
        <mesh position={[0, 1.1, 0]}>
          <cylinderGeometry args={[4.2, 4.2, 0.2, 8]} />
          <meshToonMaterial color={chaosType === 'Darkness Mode' ? '#ef4444' : "#7BC67E"} />
        </mesh>
        <House position={[0, 1.2, 0]} color={chaosType === 'Darkness Mode' ? "#ef4444" : "#4D96FF"} label={chaosType === 'Darkness Mode' ? "DOOM LAB" : "ALTITUDE LAB"} />
      </group>
    </Float>
  );
}

function DreamRealmGeometry() {
  const objects = useMemo(() => Array.from({ length: 15 }, () => ({
    x: (Math.random() - 0.5) * 60,
    y: 10 + Math.random() * 20,
    z: (Math.random() - 0.5) * 60,
    rot: Math.random() * Math.PI,
    scale: 0.5 + Math.random() * 2
  })), []);
  
  return (
    <>
      {objects.map((obj, i) => (
        <Float key={i} speed={3} rotationIntensity={2} floatIntensity={3}>
          <mesh position={[obj.x, obj.y, obj.z]} rotation={[obj.rot, obj.rot, 0]} scale={obj.scale} castShadow>
            {i % 3 === 0 ? <boxGeometry args={[1, 1.5, 0.2]} /> : i % 3 === 1 ? <octahedronGeometry args={[1]} /> : <torusGeometry args={[1, 0.2, 8, 16]} />}
            <MeshDistortMaterial color={i % 2 === 0 ? '#FFD93D' : '#8A2BE2'} speed={4} distort={0.4} />
          </mesh>
        </Float>
      ))}
    </>
  );
}

function HologramPresentation({ position, chaosEvent }: { position: [number, number, number], chaosEvent?: any }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.25, 0]} castShadow>
        <cylinderGeometry args={[1.5, 1.8, 0.5, 32]} />
        <meshToonMaterial color="#263238" />
      </mesh>
      <Float speed={2} rotationIntensity={0.5} floatIntensity={1}>
        <mesh position={[0, 4, 0]}>
          <planeGeometry args={[4, 2.5]} />
          <MeshDistortMaterial color={chaosEvent ? '#ef4444' : '#4D96FF'} speed={chaosEvent ? 8 : 2} distort={chaosEvent ? 0.6 : 0.2} transparent opacity={0.8} />
          <Html transform distanceFactor={4} position={[0,0,0.01]}>
             <div style={{ background: 'rgba(0,0,0,0.6)', color: 'white', padding: '20px', borderRadius: 20, textAlign: 'center', border: `3px solid ${chaosEvent ? '#ef4444' : '#4D96FF'}` }}>
                <h1 style={{ fontSize: 24, margin: 0, color: chaosEvent ? '#ef4444' : 'white' }}>{chaosEvent ? 'SYSTEM OVERRIDE' : 'SENSEI HUB'}</h1>
                <p>{chaosEvent ? 'CHAOS EVENT ACTIVE' : 'Welcome to the Metaverse'}</p>
             </div>
          </Html>
        </mesh>
      </Float>
    </group>
  );
}

function Island({ leaderboard = [], chaosEvent }: { leaderboard?: any[], chaosEvent?: any }) {
  return (
    <group>
      <mesh position={[0, -0.5, 0]} receiveShadow>
        <cylinderGeometry args={[35, 38, 1, 32]} />
        <meshToonMaterial color={chaosEvent?.type === 'Darkness Mode' ? '#2e3034' : "#7BC67E"} />
      </mesh>
      
      <SpeakingStatue position={[-15, 0, -15]} name="Socrates" color="#BDBDBD" />
      <SpeakingStatue position={[15, 0, 15]} name="Newton" color="#BDBDBD" />

      {chaosEvent?.type === 'Floating Islands' && (
        <>
          <FloatingIsland position={[-20, 15, -20]} />
          <FloatingIsland position={[20, 18, 20]} />
        </>
      )}

      {chaosEvent && <DreamRealmGeometry />}

      <House position={[-12, 0, -8]} color={chaosEvent?.type === 'Darkness Mode' ? '#333' : "#FFB347"} label="📐 MATH ZONE" />
      <House position={[12, 0, -8]} color={chaosEvent?.type === 'Darkness Mode' ? '#333' : "#4D96FF"} label="💻 CODE HUB" />
      <House position={[-12, 0, 12]} color={chaosEvent?.type === 'Darkness Mode' ? '#333' : "#4DB6AC"} label="🔬 SCIENCE LAB" />
      <House position={[12, 0, 12]} color={chaosEvent?.type === 'Darkness Mode' ? '#333' : "#A0785A"} label="📖 LIBRARY" />
      
      <Trampoline position={[0, 0, 18]} />
      <Trampoline position={[-20, 0, 0]} />

      <HologramPresentation position={[0, 0, 8]} chaosEvent={chaosEvent} />
      <Trees isDark={chaosEvent?.type === 'Darkness Mode'} />
      <Clouds isStorm={chaosEvent !== null && chaosEvent !== undefined} />
    </group>
  );
}

function Trampoline({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.2, 0]} receiveShadow>
        <cylinderGeometry args={[2, 2, 0.4, 16]} />
        <meshToonMaterial color="#FF6B9D" />
      </mesh>
      <mesh position={[0, 0.4, 0]}>
        <cylinderGeometry args={[1.8, 1.8, 0.1, 16]} />
        <meshToonMaterial color="#222" />
      </mesh>
      <Html position={[0, 2, 0]} center style={{ pointerEvents: 'none' }}>
        <div style={{ background: 'rgba(0,0,0,0.5)', padding: '2px 6px', borderRadius: 6, color: 'white', fontFamily: 'Fredoka', fontSize: 10, fontWeight: 'bold' }}>JUMP PAD</div>
      </Html>
    </group>
  );
}

function House({ position, color, label }: { position: [number, number, number], color: string, label: string }) {
  return (
    <group position={position}>
      <mesh castShadow receiveShadow position={[0, 1.5, 0]}>
        <boxGeometry args={[5, 3, 5]} />
        <meshToonMaterial color={color} />
      </mesh>
      <mesh castShadow position={[0, 3.75, 0]} rotation={[0, Math.PI / 4, 0]}>
        <coneGeometry args={[4.5, 2.5, 4]} />
        <meshToonMaterial color="#5D4037" />
      </mesh>
      {}
      <mesh position={[0, 1, 2.51]}>
        <boxGeometry args={[1.5, 2, 0.1]} />
        <meshToonMaterial color="#3E2723" />
      </mesh>
      {}
      <mesh position={[-1.5, 1.5, 2.51]}>
        <boxGeometry args={[1, 1, 0.1]} />
        <meshBasicMaterial color="#FFFDE7" />
      </mesh>
      <mesh position={[1.5, 1.5, 2.51]}>
        <boxGeometry args={[1, 1, 0.1]} />
        <meshBasicMaterial color="#FFFDE7" />
      </mesh>
      <Html position={[0, 5.5, 0]} center style={{ pointerEvents: 'none' }}>
        <div style={{ background: 'rgba(0,0,0,0.7)', padding: '6px 16px', borderRadius: 12, fontFamily: 'Fredoka', fontWeight: 700, fontSize: 16, color: '#fff', border: `2px solid ${color}` }}>
          {label}
        </div>
      </Html>
    </group>
  );
}

function Trees({ isDark }: { isDark?: boolean }) {
  const treePositions = useMemo(() => {
    const positions: [number, number, number][] = [];
    for (let i = 0; i < 25; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = 10 + Math.random() * 20;
      positions.push([Math.cos(angle) * dist, 0, Math.sin(angle) * dist]);
    }
    return positions;
  }, []);
  return (
    <>
      {treePositions.map((pos, i) => (
        <group key={i} position={pos}>
          <mesh position={[0, 1, 0]} castShadow>
            <cylinderGeometry args={[0.2, 0.3, 2, 6]} />
            <meshToonMaterial color={isDark ? "#222" : "#5D4037"} />
          </mesh>
          <mesh position={[0, 3, 0]} castShadow>
            <coneGeometry args={[1.5, 3, 8]} />
            <meshToonMaterial color={isDark ? "#444" : (i % 2 === 0 ? "#4CAF50" : "#388E3C")} />
          </mesh>
        </group>
      ))}
    </>
  );
}

function Clouds({ isStorm }: { isStorm?: boolean }) {
  const cloudRefs = useRef<THREE.Mesh[]>([]);
  const cloudData = useMemo(() => Array.from({ length: 8 }, () => ({ x: -40 + Math.random() * 80, y: 15 + Math.random() * 8, z: -30 + Math.random() * 60, scale: 1 + Math.random() * 2, speed: 0.5 + Math.random() * 1 })), []);
  useFrame(() => { 
    cloudRefs.current.forEach((cloud, i) => { 
      if (cloud) { 
        cloud.position.x += cloudData[i].speed * (isStorm ? 0.05 : 0.01); 
        if (cloud.position.x > 50) cloud.position.x = -50; 
      } 
    }); 
  });
  return (
    <>
      {cloudData.map((c, i) => (
        <mesh key={i} ref={el => { if (el) cloudRefs.current[i] = el; }} position={[c.x, c.y, c.z]} scale={c.scale}>
          <sphereGeometry args={[2, 8, 6]} />
          <meshBasicMaterial color={isStorm ? "#444" : "#ffffff"} transparent opacity={isStorm ? 0.9 : 0.6} />
        </mesh>
      ))}
    </>
  );
}


function PlayerModel({ color = "#FFCC80", isMe = false, streak = 0, isWalking = false }) {
  const leftLegRef = useRef<THREE.Group>(null);
  const rightLegRef = useRef<THREE.Group>(null);
  const bodyRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (isWalking) {
      const t = state.clock.elapsedTime * 8;
      if (leftLegRef.current) leftLegRef.current.rotation.x = Math.sin(t) * 0.6;
      if (rightLegRef.current) rightLegRef.current.rotation.x = Math.sin(t + Math.PI) * 0.6;
      if (bodyRef.current) bodyRef.current.position.y = 0.85 + Math.abs(Math.sin(t * 2)) * 0.05;
    } else {
      if (leftLegRef.current) leftLegRef.current.rotation.x = THREE.MathUtils.lerp(leftLegRef.current.rotation.x, 0, 0.1);
      if (rightLegRef.current) rightLegRef.current.rotation.x = THREE.MathUtils.lerp(rightLegRef.current.rotation.x, 0, 0.1);
      if (bodyRef.current) bodyRef.current.position.y = THREE.MathUtils.lerp(bodyRef.current.position.y, 0.85, 0.1);
    }
  });

  return (
    <group>
      {}
      <mesh position={[0, 1.5, 0]} castShadow>
        <boxGeometry args={[0.5, 0.5, 0.5]} />
        <meshToonMaterial color={color} />
        {}
        <mesh position={[0.1, 0.05, 0.26]}>
          <boxGeometry args={[0.1, 0.1, 0.05]} />
          <meshBasicMaterial color="#000" />
        </mesh>
        <mesh position={[-0.1, 0.05, 0.26]}>
          <boxGeometry args={[0.1, 0.1, 0.05]} />
          <meshBasicMaterial color="#000" />
        </mesh>
      </mesh>
      {}
      <mesh ref={bodyRef} position={[0, 0.85, 0]} castShadow>
        <boxGeometry args={[0.6, 0.8, 0.3]} />
        <meshToonMaterial color={isMe ? "#4D96FF" : "#FF6B9D"} />
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
      {streak >= 5 && (
        <mesh position={[0, 0.85, 0]}>
          <sphereGeometry args={[0.8, 16, 16]} />
          <meshBasicMaterial color="#FFD700" transparent opacity={0.2} wireframe />
        </mesh>
      )}
    </group>
  );
}

function LocalPlayer({ onMove, joystickMove, jumpTrigger, streak = 0, message = null, gravityInverted = false, knockbackTrigger = null }: { onMove: (pos: any, rot: any, anim: string) => void, joystickMove?: { x: number, y: number } | null, jumpTrigger?: number, streak?: number, message?: string | null, gravityInverted?: boolean, knockbackTrigger?: any }) {
  const meshRef = useRef<THREE.Group>(null);
  const velocity = useRef(new THREE.Vector3());
  const lastKnockbackId = useRef(0);
  const { camera } = useThree();
  const lastEmit = useRef(0);
  const keys = useRef<Record<string, boolean>>({});
  const lastJumpTrigger = useRef(0);
  const [isWalking, setIsWalking] = useState(false);
  const isWalkingRef = useRef(false);

  useEffect(() => {
    const down = (e: KeyboardEvent) => { keys.current[e.key.toLowerCase()] = true; };
    const up = (e: KeyboardEvent) => { keys.current[e.key.toLowerCase()] = false; };
    window.addEventListener('keydown', down); window.addEventListener('keyup', up);
    return () => { window.removeEventListener('keydown', down); window.removeEventListener('keyup', up); };
  }, []);

  useFrame((state, delta) => {
    if (!meshRef.current) return;


    if (knockbackTrigger && knockbackTrigger.id !== lastKnockbackId.current) {
      lastKnockbackId.current = knockbackTrigger.id;
      velocity.current.set(knockbackTrigger.x, knockbackTrigger.y, knockbackTrigger.z);
    }

    const k = keys.current;
    
    const speedBoost = streak >= 5 ? 1.5 : 1;
    
    const jx = joystickMove?.x || 0;
    const jz = -(joystickMove?.y || 0);
    const isRunning = k['shift'];
    const speed = (isRunning ? 12 : 7) * speedBoost;
    const move = new THREE.Vector3(jx, 0, jz);
    if (k['w'] || k['arrowup']) move.z -= 1; if (k['s'] || k['arrowdown']) move.z += 1;
    if (k['a'] || k['arrowleft']) move.x -= 1; if (k['d'] || k['arrowright']) move.x += 1;
    
    const isMoving = move.length() > 0;
    if (isWalkingRef.current !== isMoving) {
      isWalkingRef.current = isMoving;
      setIsWalking(isMoving);
    }

    if (isMoving) {
      move.normalize().multiplyScalar(speed * delta);

      const cameraDir = new THREE.Vector3(); 
      camera.getWorldDirection(cameraDir); 
      cameraDir.y = 0; 
      cameraDir.normalize();
      const cameraRight = new THREE.Vector3().crossVectors(cameraDir, new THREE.Vector3(0, 1, 0));
      const worldMove = new THREE.Vector3().addScaledVector(cameraRight, move.x).addScaledVector(cameraDir, -move.z);
      
      const newPos = meshRef.current.position.clone().add(worldMove);

      if (newPos.length() < 34) {
        meshRef.current.position.copy(newPos);
      }

      const targetRotation = Math.atan2(worldMove.x, worldMove.z);

      let diff = targetRotation - meshRef.current.rotation.y;
      while (diff < -Math.PI) diff += Math.PI * 2;
      while (diff > Math.PI) diff -= Math.PI * 2;
      meshRef.current.rotation.y += diff * 10 * delta;
    }


    const isGrounded = gravityInverted ? meshRef.current.position.y >= 9.9 : meshRef.current.position.y <= 0.01;
    

    let jumpVelocity = gravityInverted ? -12 : 12;
    if (isGrounded) {
       const px = meshRef.current.position.x;
       const pz = meshRef.current.position.z;
       if ((Math.abs(px - 0) < 2 && Math.abs(pz - 18) < 2) || (Math.abs(px - -20) < 2 && Math.abs(pz - 0) < 2)) {
          jumpVelocity = gravityInverted ? -30 : 30;
       }
    }
    
    const tryJump = k[' '] || (jumpTrigger && jumpTrigger !== lastJumpTrigger.current);
    if (tryJump && isGrounded) {
      if (jumpTrigger) lastJumpTrigger.current = jumpTrigger;
      velocity.current.y = jumpVelocity;
    } else if (Math.abs(jumpVelocity) > 15 && isGrounded && !tryJump) {

      velocity.current.y = jumpVelocity;
    }

    const g = gravityInverted ? -25 : 25;
    velocity.current.y -= g * delta;
    meshRef.current.position.y += velocity.current.y * delta;
    
    if (!gravityInverted && meshRef.current.position.y < 0) { 
      meshRef.current.position.y = 0; 
      velocity.current.y = 0; 
    }
    if (gravityInverted && meshRef.current.position.y > 10) { 
      meshRef.current.position.y = 10; 
      velocity.current.y = 0; 
    }


    const idealOffset = new THREE.Vector3(0, 8, 12);
    const targetPos = meshRef.current.position.clone().add(idealOffset);
    camera.position.lerp(targetPos, 0.1);
    camera.lookAt(meshRef.current.position.clone().add(new THREE.Vector3(0, 1.5, 0)));
    
    const now = Date.now();
    if (now - lastEmit.current > 50) {
      onMove({ x: meshRef.current.position.x, y: meshRef.current.position.y, z: meshRef.current.position.z }, { y: meshRef.current.rotation.y }, isMoving ? 'walk' : 'idle');
      lastEmit.current = now;
    }
  });

  return (
    <group ref={meshRef}>
      <PlayerModel isMe={true} streak={streak} isWalking={isWalking} />
      {!message && (
        <Html position={[0, 2.5, 0]} center style={{ pointerEvents: 'none' }}>
           <div style={{ background: 'rgba(0,0,0,0.7)', color: 'white', padding: '2px 8px', borderRadius: 6, fontSize: 11, fontWeight: 'bold', whiteSpace: 'nowrap' }}>You {streak > 0 && `🔥${streak}`}</div>
        </Html>
      )}
      <AnimatePresence>
        {message && (
          <Html position={[0, 3, 0]} center>
            <motion.div initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0, opacity: 0 }} style={{ background: 'white', padding: '6px 12px', borderRadius: 12, fontWeight: 600, border: '2px solid #4D96FF', color: 'black', whiteSpace: 'nowrap' }}>
              {message}
            </motion.div>
          </Html>
        )}
      </AnimatePresence>
    </group>
  );
}

function RemotePlayerMesh({ player, message }: { player: Player, message?: string }) {
  const meshRef = useRef<THREE.Group>(null);
  useFrame(() => { 
    if (meshRef.current) { 
      meshRef.current.position.lerp(new THREE.Vector3(player.position.x, player.position.y, player.position.z), 0.15); 

      let diff = (player.rotation?.y || 0) - meshRef.current.rotation.y;
      while (diff < -Math.PI) diff += Math.PI * 2;
      while (diff > Math.PI) diff -= Math.PI * 2;
      meshRef.current.rotation.y += diff * 0.15;
    } 
  });
  return (
    <group ref={meshRef}>
      <PlayerModel isMe={false} isWalking={player.animation === 'walk'} />
      {!message && (
        <Html position={[0, 2.5, 0]} center style={{ pointerEvents: 'none' }}>
           <div style={{ background: 'rgba(0,0,0,0.5)', color: 'white', padding: '2px 8px', borderRadius: 6, fontSize: 11, whiteSpace: 'nowrap' }}>{player.username}</div>
        </Html>
      )}
      <AnimatePresence>
        {message && (
          <Html position={[0, 3, 0]} center>
            <motion.div initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0, opacity: 0 }} style={{ background: 'white', padding: '6px 12px', borderRadius: 12, fontWeight: 600, color: 'black', border: '2px solid #FF6B9D', whiteSpace: 'nowrap' }}>
              {message}
            </motion.div>
          </Html>
        )}
      </AnimatePresence>
    </group>
  );
}

export default function WorldScene({ players, npcs = [], myUserId, onMove, joystickMove, jumpTrigger, talkingUsers = new Set(), reactions = {}, playerMessages = {}, leaderboard = [], chaosEvent, crowdState, hideUI = false, knockbackTrigger = null }: WorldSceneProps) {
  const myUserIdStr = myUserId?.toString();
  const remotePlayers = players.filter(p => p.userId?.toString() !== myUserIdStr);
  const myStreak = leaderboard?.find(l => l.userId?.toString() === myUserIdStr)?.streak || 0;

  return (
    <Canvas shadows camera={{ position: [0, 8, 12], fov: 60 }} style={{ position: 'absolute', inset: 0 }}>
      <AmbientEngine weatherOverride={chaosEvent?.type === 'Darkness Mode' ? 'storm' : undefined} crowdDensity={crowdState?.density as any} />
      
      <HallOfFame leaderboard={leaderboard} />
      <Island leaderboard={leaderboard} chaosEvent={chaosEvent} />
      <NpcSystem npcs={npcs} playerMessages={playerMessages} />
      
      {!hideUI && (
        <>
          <LocalPlayer onMove={onMove} joystickMove={joystickMove} jumpTrigger={jumpTrigger} streak={myStreak} message={playerMessages[myUserId]} gravityInverted={chaosEvent?.type === 'Gravity Reversal'} knockbackTrigger={knockbackTrigger} />
          {remotePlayers.map(p => (
            <RemotePlayerMesh key={p.userId} player={p} message={playerMessages[p.userId]} />
          ))}
        </>
      )}
      {hideUI && (
        <LocalPlayer onMove={onMove} joystickMove={joystickMove} jumpTrigger={jumpTrigger} streak={myStreak} message={null} gravityInverted={chaosEvent?.type === 'Gravity Reversal'} knockbackTrigger={knockbackTrigger} />
      )}
      {}
    </Canvas>
  );
}
