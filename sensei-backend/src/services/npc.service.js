import { callHuggingFace } from './huggingface.service.js';

const NPC_PERSONALITIES = [
  { name: 'Ethan', trait: 'The Joker. Friendly and hilarious.', avatar: 'https://i.pravatar.cc/150?u=Ethan', color: '#FFD93D', behavior: 'joker' },
  { name: 'Luna', trait: 'The Techie. Fast and efficient.', avatar: 'https://i.pravatar.cc/150?u=Luna', color: '#4D96FF', behavior: 'techie' },
  { name: 'Newton', trait: 'The Physicist. Wise discoverer of gravity.', avatar: 'https://i.pravatar.cc/150?u=Newton', color: '#a855f7', behavior: 'physicist' },
  { name: 'Sophia', trait: 'The Sage. Wise and peaceful.', avatar: 'https://i.pravatar.cc/150?u=Sophia', color: '#6BCB77', behavior: 'sage' },
];

let baseNpcs = NPC_PERSONALITIES.map((p, i) => ({
  id: `npc_${i}`,
  ...p,
  position: { x: (Math.random() - 0.5) * 30, y: 0, z: (Math.random() - 0.5) * 30 },
  rotation: { y: Math.random() * Math.PI * 2 },
  animation: 'idle',
  mood: ['happy', 'curious', 'competitive'][Math.floor(Math.random() * 3)],
  lastMessage: '',
  lastThought: 'Wandering the virtual world...',
  score: Math.floor(Math.random() * 1000),
  streak: Math.floor(Math.random() * 5),
  targetPos: null,
  isThinking: false
}));

let invasionNpcs = [];

export const getNPCs = () => [...baseNpcs, ...invasionNpcs];

export const spawnMentorNPC = (name = 'Albert Einstein', trait = 'World-famous theoretical physicist. Can answer deep physics questions.') => {
  invasionNpcs = [{
    id: `mentor_${Date.now()}`,
    name,
    trait,
    avatar: `https://i.pravatar.cc/150?u=${encodeURIComponent(name)}`,
    color: '#a855f7',
    position: { x: (Math.random() - 0.5) * 20, y: 0, z: (Math.random() - 0.5) * 20 },
    rotation: { y: Math.random() * Math.PI * 2 },
    animation: 'idle',
    mood: 'scholarly',
    lastMessage: `Greetings! I am ${name}. Ask me any question!`,
    lastThought: 'Awaiting academic inquiry...',
    score: 999,
    streak: 99,
    isMentor: true,
    targetPos: null,
    isThinking: false,
    behavior: 'mentor'
  }];
};

export const clearMentorNPC = () => {
  invasionNpcs = [];
};

export const updateNPCs = async (io, roomId, players) => {
  const allNpcs = getNPCs();
  const playerArr = players ? Array.from(players.values()) : [];

  for (const npc of allNpcs) {
    let newTarget = null;

    if (playerArr.length > 0) {
      let closestPlayer = null;
      let minD = Infinity;
      for (const p of playerArr) {
        const dx = p.position.x - npc.position.x;
        const dz = p.position.z - npc.position.z;
        const dist = Math.sqrt(dx*dx + dz*dz);
        if (dist < minD) { minD = dist; closestPlayer = p; }
      }

      if (closestPlayer && minD < 12) {
        if (npc.behavior === 'physicist' && minD < 4 && Math.random() > 0.8 && !npc.isThinking) {
          const physicsTips = [
            "Do you know the three laws of motion? 🍎",
            "Gravity is a force attracting all objects with mass! 🌌",
            "F = ma is the cornerstone of classical mechanics! ⚡",
            "Every action has an equal and opposite reaction! 💥"
          ];
          const msg = physicsTips[Math.floor(Math.random() * physicsTips.length)];
          io.to(roomId).emit('world:player_message', { userId: npc.id, message: msg });
          io.to(roomId).emit('world:reaction', { userId: npc.id, emoji: '🍎' });
        }

        if (npc.behavior === 'joker' && Math.random() > 0.9 && !npc.isThinking) {
           const jokes = ["Why was the math book sad? Too many problems! 😂", "I'm not an NPC, I'm just slow-rendered! 🤖", "Wait, are you real? 🧐", "I'm watching you... 👀"];
           const msg = jokes[Math.floor(Math.random() * jokes.length)];
           io.to(roomId).emit('world:player_message', { userId: npc.id, message: msg });
           io.to(roomId).emit('world:reaction', { userId: npc.id, emoji: '😂' });
        }

        if (minD < 10 && Math.random() > 0.7) {
          newTarget = {
            x: closestPlayer.position.x + (Math.random() - 0.5) * 3,
            y: 0,
            z: closestPlayer.position.z + (Math.random() - 0.5) * 3
          };
        }
      }
    }

    const now = Date.now();
    if (!npc.nextStateChange) npc.nextStateChange = now + Math.random() * 5000;

    if (now >= npc.nextStateChange || newTarget) {
        if (!newTarget) {
          npc.targetPos = {
             x: (Math.random() - 0.5) * 45,
             y: 0,
             z: (Math.random() - 0.5) * 45
          };
        } else {
          npc.targetPos = newTarget;
        }
        
        if (Math.abs(npc.targetPos.x) > 30) npc.targetPos.x = Math.sign(npc.targetPos.x) * 28;
        if (Math.abs(npc.targetPos.z) > 30) npc.targetPos.z = Math.sign(npc.targetPos.z) * 28;
        
        const dx = npc.targetPos.x - npc.position.x;
        const dz = npc.targetPos.z - npc.position.z;
        npc.rotation.y = Math.atan2(dx, dz);
        
        npc.animation = 'walk';
        npc.nextStateChange = now + 3000 + Math.random() * 5000;
    }

    if (npc.animation === 'walk' && npc.targetPos) {
       const speed = npc.isMentor ? 2.5 : npc.behavior === 'techie' ? 3.5 : 2.0;
       const dx = npc.targetPos.x - npc.position.x;
       const dz = npc.targetPos.z - npc.position.z;
       const dist = Math.sqrt(dx*dx + dz*dz);
       
       if (dist < 0.5) {
          npc.animation = 'idle';
          npc.nextStateChange = now + 1000 + Math.random() * 3000;
       } else {
          npc.position.x += (dx / dist) * speed * 0.5;
          npc.position.z += (dz / dist) * speed * 0.5;
       }
    }

    if (Math.abs(npc.position.x) > 32) npc.position.x = Math.sign(npc.position.x) * 31;
    if (Math.abs(npc.position.z) > 32) npc.position.z = Math.sign(npc.position.z) * 31;

    if (Math.random() > 0.95 && !npc.isThinking) {
      npc.isThinking = true;
      const prompt = `You are ${npc.name} (${npc.trait}). Your mood is ${npc.mood}. Short one-liner (max 5 words)?`;
      callHuggingFace(prompt)
        .then(response => {
          if (response) {
            npc.lastMessage = response;
            io.to(roomId).emit('world:player_message', { userId: npc.id, message: response });
          }
        })
        .catch(() => {})
        .finally(() => { npc.isThinking = false; });
    }
  }
  io.to(roomId).emit('world:npc_update', allNpcs);
};

export const handleNPCChat = async (npcId, userMsg) => {
  const npc = getNPCs().find(n => n.id === npcId);
  if (!npc) return null;
  const prompt = `Student says: "${userMsg}". You are ${npc.name}. Trait: ${npc.trait}. Reply shortly.`;
  return await callHuggingFace(prompt);
};

export default { getNPCs, updateNPCs, handleNPCChat, spawnMentorNPC, clearMentorNPC };
