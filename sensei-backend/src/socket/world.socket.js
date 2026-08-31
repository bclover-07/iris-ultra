import WorldRoom from '../models/WorldRoom.js';
import WorldSession from '../models/WorldSession.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import npcService from '../services/npc.service.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const quizPoolPath = path.join(__dirname, '../data/quiz_questions.json');
let quizTemplates = [];

try {
  const data = fs.readFileSync(quizPoolPath, 'utf8');
  quizTemplates = JSON.parse(data);
} catch (err) {
  quizTemplates = [{ question: 'What is 15 × 12?', options: ['170', '180', '190', '160'], correctAnswer: '180', subject: 'Math' }];
}

const roomPlayers = new Map();
const roomQuizTimers = new Map();
const socketToRoom = new Map();
const activeRooms = new Map();
const roomChaosEvents = new Map();
const roomCloseTimers = new Map();

function getSortedLeaderboard(roomId) {
  const players = roomPlayers.get(roomId);
  if (!players) return [];
  return [...players.values()]
    .sort((a, b) => b.score - a.score || a.username.localeCompare(b.username))
    .map((p, i) => ({ rank: i + 1, userId: p.userId, username: p.username, score: p.score, streak: p.streak, avatar: p.avatar }));
}

function startQuizTimer(roomId, worldNs) {
  if (roomQuizTimers.has(roomId)) return;

  const runSecondary = async () => {
    const players = roomPlayers.get(roomId);
    if (!players || players.size === 0) {
      roomQuizTimers.get(roomId).secondaryTimer = null;
      return;
    }

    try {
      await npcService.updateNPCs(worldNs, roomId, players);

      const count = players.size;
      worldNs.to(roomId).emit('world:crowd_state', {
        density: count > 10 ? 'high' : count > 5 ? 'medium' : 'low',
        playerCount: count
      });


      if (Math.random() < 0.004 && !roomChaosEvents.has(roomId)) {
        const types = ['Gravity Reversal', 'XP Storm', 'Mentor Consultation', 'Darkness Mode', 'Quiz Tornado'];
        const type = types[Math.floor(Math.random() * types.length)];
        const duration = 60000;
        roomChaosEvents.set(roomId, { type, duration });
        
        worldNs.to(roomId).emit('world:chaos_event', { type, duration });
        
        if (type === 'Mentor Consultation') {
          const mentors = [
            { name: 'Albert Einstein', trait: 'Theoretical physicist. Speaks about relativity and physics.' },
            { name: 'Marie Curie', trait: 'Chemist and physicist. Speaks about radioactivity and perseverance.' },
            { name: 'Ada Lovelace', trait: 'Mathematician and writer. Speaks about computer programming.' },
            { name: 'Socrates', trait: 'Philosopher. Asks deep questions about knowledge and ethics.' }
          ];
          const mentor = mentors[Math.floor(Math.random() * mentors.length)];
          npcService.spawnMentorNPC(mentor.name, mentor.trait);
        }

        setTimeout(() => {
          roomChaosEvents.delete(roomId);
          if (type === 'Mentor Consultation') npcService.clearMentorNPC();
          worldNs.to(roomId).emit('world:chaos_end');
        }, duration);
      }
    } catch (err) {
      console.error(`Error in room ${roomId} secondary loop:`, err);
    }

    const state = roomQuizTimers.get(roomId);
    if (state) {
      state.secondaryTimer = setTimeout(runSecondary, 2000);
    }
  };

  const timerState = roomQuizTimers.get(roomId) || {};
  timerState.secondaryTimer = setTimeout(runSecondary, 2000);
  roomQuizTimers.set(roomId, timerState);

  const scheduleNext = () => {
    const delay = Math.floor(Math.random() * 15000) + 45000;
    const timerId = setTimeout(() => {
      const players = roomPlayers.get(roomId);
      if (!players || players.size === 0) { 
        stopQuizTimer(roomId); 
        return; 
      }
      
      const q = quizTemplates[Math.floor(Math.random() * quizTemplates.length)];
      const questionId = `q_${Date.now()}`;
      const timerState = roomQuizTimers.get(roomId) || {};
      timerState.currentQuestion = { ...q, _id: questionId };
      timerState.questionStartedAt = Date.now();
      roomQuizTimers.set(roomId, timerState);

      worldNs.to(roomId).emit('world:quiz_start', {
        questionId, question: q.question, options: q.options, timeLimit: 5, subject: q.subject,
      });


      setTimeout(() => {
        const state = roomQuizTimers.get(roomId);
        if (state && state.currentQuestion?._id === questionId) {
          state.currentQuestion = null;
          state.questionStartedAt = null;
        }
      }, 6000);


      setTimeout(() => {
        const npcs = npcService.getNPCs();
        npcs.forEach(npc => {
          if (Math.random() > 0.3) {

            const isSmart = !npc.isInvader && Math.random() > 0.2;
            const answer = isSmart ? q.correctAnswer : q.options[Math.floor(Math.random() * q.options.length)];
            
            if (isSmart) {
              npc.score = (npc.score || 0) + 50;
              npc.streak = (npc.streak || 0) + 1;
            } else {
              npc.streak = 0;
            }
            

            worldNs.to(roomId).emit('world:score_update', { userId: npc.id, xpEarned: isSmart ? 50 : 0, newTotal: npc.score, streak: npc.streak, isCorrect: isSmart });
            

            if (isSmart && npc.streak > 3) {
               worldNs.to(roomId).emit('world:reaction', { userId: npc.id, emoji: '👏' });
            }
          }
        });
        worldNs.to(roomId).emit('world:leaderboard_update', getSortedLeaderboard(roomId));
      }, 5000 + Math.random() * 5000);

      timerState.timerId = setTimeout(scheduleNext, 20000);
    }, delay);
    

    roomQuizTimers.set(roomId, { ...roomQuizTimers.get(roomId), timerId, currentQuestion: null, questionStartedAt: null });
  };
  scheduleNext();
}

function stopQuizTimer(roomId) {
  const state = roomQuizTimers.get(roomId);
  if (state?.timerId) clearTimeout(state.timerId);
  if (state?.secondaryTimer) clearTimeout(state.secondaryTimer);
  roomQuizTimers.delete(roomId);
}

async function handlePlayerLeave(socket, roomId, userId, worldNs) {
  const players = roomPlayers.get(roomId);
  if (!players) return;
  const player = players.get(userId);
  if (!player) return;

  if (player.socketId !== socket.id) {
    socketToRoom.delete(socket.id);
    return;
  }

  WorldSession.create({
    userId, roomId, joinedAt: new Date(player.joinedAt), leftAt: new Date(),
    xpEarned: player.score,
    finalRank: getSortedLeaderboard(roomId).findIndex(p => p.userId === userId) + 1,
    questionsAnswered: player.questionsAnswered || 0,
    correctAnswers: player.correctAnswers || 0,
    bestStreak: player.bestStreak || 0,
  }).catch(err => {});

  players.delete(userId);
  socketToRoom.delete(socket.id);
  socket.leave(roomId);

  worldNs.to(roomId).emit('world:player_left', { userId, socketId: socket.id });
  worldNs.to(roomId).emit('world:leaderboard_update', getSortedLeaderboard(roomId));

  WorldRoom.updateOne({ roomId }, { $pull: { currentPlayers: userId } }).exec();

  if (players.size === 0) {
    stopQuizTimer(roomId);
    



    console.log(`Room ${roomId} is now empty. Keeping active for persistence.`);
    roomPlayers.delete(roomId);
    activeRooms.delete(roomId);
    roomChaosEvents.delete(roomId);
    if (roomCloseTimers.has(roomId)) {
      clearTimeout(roomCloseTimers.get(roomId));
      roomCloseTimers.delete(roomId);
    }
  }
}

export default function setupWorldSocket(io) {
  const worldNs = io.of('/world');

  worldNs.on('connection', (socket) => {
    socket.on('world:join', async ({ roomId, userId, username, avatar }) => {
      try {

        if (roomCloseTimers.has(roomId)) {
          clearTimeout(roomCloseTimers.get(roomId));
          roomCloseTimers.delete(roomId);
        }

        if (!activeRooms.has(roomId)) {
          const room = await WorldRoom.findOne({ roomId, isActive: true }).lean();
          if (!room) { socket.emit('world:error', { message: 'Room not found' }); return; }
          activeRooms.set(roomId, { name: room.name });
        }

        let players = roomPlayers.get(roomId);
        if (!players) { players = new Map(); roomPlayers.set(roomId, players); }

        const playerData = {
          userId, socketId: socket.id, username, avatar,
          position: { x: 0, y: 1, z: 0 }, rotation: { y: 0 }, animation: 'idle',
          score: 0, streak: 0, joinedAt: Date.now(),
        };
        players.set(userId, playerData);
        socketToRoom.set(socket.id, { roomId, userId });

        socket.join(roomId);
        socket.emit('world:room_state', {
          players: [...players.values()],
          npcs: npcService.getNPCs(),
          leaderboard: getSortedLeaderboard(roomId),
          roomMeta: activeRooms.get(roomId),
          chaosEvent: roomChaosEvents.get(roomId)
        });

        socket.to(roomId).emit('world:player_joined', { userId, socketId: socket.id, username, avatar, position: { x: 0, y: 1, z: 0 } });
        startQuizTimer(roomId, worldNs);
      } catch (err) { socket.emit('world:error', { message: 'Failed to join' }); }
    });

    socket.on('world:move', ({ roomId, userId, position, rotation, animation }) => {
      const players = roomPlayers.get(roomId);
      if (!players || !players.has(userId)) return;
      const p = players.get(userId);
      p.position = position; p.rotation = rotation; p.animation = animation;
      socket.to(roomId).emit('world:player_moved', { userId, position, rotation, animation });
    });

    socket.on('world:quiz_answer', ({ roomId, userId, questionId, answer, timeMs }) => {
      const players = roomPlayers.get(roomId);
      if (!players || !players.has(userId)) return;
      const timerState = roomQuizTimers.get(roomId);
      if (!timerState?.currentQuestion || timerState.currentQuestion._id !== questionId) return;

      const player = players.get(userId);
      

      if (Date.now() - timerState.questionStartedAt > 6000) {
        socket.emit('world:error', { message: 'Too slow! Quiz expired.' });
        return;
      }

      const isCorrect = answer === timerState.currentQuestion.correctAnswer;
      let xpEarned = 0;

      if (isCorrect) {
        xpEarned = 50;
        player.streak += 1;
        xpEarned += player.streak * 10;
        

        if (player.streak >= 12) xpEarned *= 1.5;


        const event = roomChaosEvents.get(roomId);
        if (event?.type === 'XP Storm') xpEarned *= 5;
      } else {
        player.streak = 0;
      }

      player.score += xpEarned;
      worldNs.to(roomId).emit('world:score_update', { userId, xpEarned, newTotal: player.score, streak: player.streak, isCorrect });
      worldNs.to(roomId).emit('world:leaderboard_update', getSortedLeaderboard(roomId));
      socket.emit('world:quiz_result', { isCorrect, correctAnswer: timerState.currentQuestion.correctAnswer, xpEarned });
    });

    socket.on('world:chat', async ({ roomId, userId, username, message }) => {
      worldNs.to(roomId).emit('world:chat_message', { userId, username, message, timestamp: Date.now() });
      socket.to(roomId).emit('world:player_message', { userId, message });


      const npcs = npcService.getNPCs();
      const mentionedNpc = npcs.find(n => message.toLowerCase().includes(n.name.toLowerCase()));
      if (mentionedNpc) {
        try {
          const reply = await npcService.handleNPCChat(mentionedNpc.id, message);
          if (reply) {
            setTimeout(() => {
              worldNs.to(roomId).emit('world:chat_message', { userId: mentionedNpc.id, username: mentionedNpc.name, message: reply, timestamp: Date.now() });
              worldNs.to(roomId).emit('world:player_message', { userId: mentionedNpc.id, message: reply });
            }, 1000 + Math.random() * 2000);
          }
        } catch (err) {}
      }
    });

    socket.on('talking_state', ({ talking }) => {
       const info = socketToRoom.get(socket.id);
       if (info) worldNs.to(info.roomId).emit('world:talking_state', { userId: info.userId, talking });
    });


    socket.on('webrtc_signal', (data) => {
      const info = socketToRoom.get(socket.id);
      if (!info) return;
      socket.to(data.target).emit('webrtc_signal', { ...data, sender: socket.id });
    });

    socket.on('disconnect', () => {
      const info = socketToRoom.get(socket.id);
      if (info) handlePlayerLeave(socket, info.roomId, info.userId, worldNs);
    });
  });
}
