import { getDebateGraph } from '../agents/virtualDebateAgent.js';
import DebateSession from '../models/DebateSession.js';
import DebateReport from '../models/DebateReport.js';
import User from '../models/User.js';


const activeSessions  = new Map();
const socketToSession = new Map();

export default function setupDebateSocket(io) {
  const ns = io.of('/debate');
  ns.on('connection', (socket) => {


    socket.on('debate:start', async ({ sessionId, userId, topic, aiPersonality, debateMode, roomStyle, totalRounds, side }) => {
      const state = {
        sessionId, userId, topic, aiPersonality,
        debateMode: debateMode || 'standard',
        roomStyle: roomStyle || 'university_hall',
        side: side || 'pro',
        round: 0, totalRounds: totalRounds || 6,
        conversationHistory: [], scoreTurns: 0,
        emotionTimeline: [], logicScores: [],
        fallaciesDetected: [], throwableEvents: [],
        crowdMood: 50, heatLevel: 1,
        scores: { logic:0,confidence:0,clarity:0,emotionalControl:0,persuasion:0,diplomacy:0,overall:0 },
        phase: 'opening', shouldEnd: false,
        startedAt: Date.now(), lastActivityAt: Date.now()
      };
      activeSessions.set(sessionId, state);
      socketToSession.set(socket.id, sessionId);
      socket.join(sessionId);

      try {
        await DebateSession.create({
          sessionId,
          userId,
          topic,
          aiPersonality,
          debateMode: debateMode || 'standard',
          side: side || 'pro',
          startedAt: new Date(),
          status: 'active'
        });
      } catch (err) {
        console.error('Failed to create DebateSession:', err);
      }

      let openingState;
      try {
        openingState = await getDebateGraph().invoke({
          ...state,
          studentArgument: `I am ready to debate on the topic: ${topic}. I will argue in ${(side || 'pro') === 'pro' ? 'support of' : 'opposition to'} it.`,
          audioMetrics: { wpm:130, fillerCount:0, wordCount:10 },
          mediaPipeData: { frustrationScore:0.1, confidenceScore:0.8, aggressionScore:0.1, postureScore:0.8, expressionState:'neutral' },
          clientNLP: { sentiment:{label:'POSITIVE',score:0.8}, toxicityScore:0 },
          currentThrows: []
        });
      } catch (err) {
        console.error('Debate opening invocation failed:', err);
        const aiStanceText = (side || 'pro') === 'con' ? 'in favor of' : 'against';
        openingState = {
          frontendPayload: {
            aiText: `Welcome to the debate arena. The topic is "${topic}". I will argue ${aiStanceText} this position. Please present your opening argument.`,
            aiEmotion: 'calm',
            aiGesture: 'none',
            isInterrupt: false,
            shouldCutMic: false,
            micCutDuration: 0,
            crowdMood: 50,
            crowdReaction: 'neutral',
            heatLevel: 1,
            coachingNudge: null,
            fallacyAlert: null,
            round: 1,
            phase: 'opening',
            totalRounds: totalRounds || 6,
            scores: state.scores,
            shouldEnd: false
          }
        };
      }
      activeSessions.set(sessionId, { ...state, ...openingState });
      socket.emit('debate:ai_turn', openingState.frontendPayload);
    });

    socket.on('debate:argument', async ({ sessionId, transcript, audioMetrics, mediaPipeData, clientNLP, throws }) => {
      const sess = activeSessions.get(sessionId);
      if (!sess) { socket.emit('debate:error', { message: 'Session not found' }); return; }

      socket.emit('debate:thinking', { state: 'analyzing_argument' });

      let result;
      try {
        result = await Promise.race([
          getDebateGraph().invoke({
            ...sess,
            studentArgument: transcript,
            audioMetrics:    audioMetrics || {},
            mediaPipeData:   mediaPipeData || {},
            clientNLP:       clientNLP || {},
            currentThrows:   throws || [],
            startedAt:       sess.startedAt
          }),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Debate processing timeout')), 30000))
        ]);
      } catch(e) {
        console.error('Debate processing error:', e);
        socket.emit('debate:ai_turn', { 
          aiText: "That's an interesting point. Let's keep moving.", 
          frontendPayload: {
            aiText: "That's an interesting point. Let's keep moving.",
            aiEmotion: 'calm',
            aiGesture: 'none',
            isInterrupt: false,
            shouldCutMic: false,
            micCutDuration: 0,
            crowdMood: sess.crowdMood || 50,
            crowdReaction: 'neutral',
            heatLevel: sess.heatLevelDisplay || 1,
            coachingNudge: null,
            fallacyAlert: null,
            round: sess.round || 1,
            phase: sess.phase || 'rebuttal',
            totalRounds: sess.totalRounds || 6,
            scores: sess.scores,
            shouldEnd: false
          }
        });
        return;
      }


      const updated = { ...sess, ...result };
      if (result.logicScore) updated.logicScores = [...(sess.logicScores||[]), result.logicScore];
      activeSessions.set(sessionId, updated);

      socket.emit('debate:ai_turn', result.frontendPayload);
      if (result.crowdReaction) socket.emit('debate:crowd_reaction', { reaction: result.crowdReaction, mood: result.crowdMood });


      if (result.shouldEnd && result.psychologicalBreakdown) {
        const psych = result.psychologicalBreakdown;
        const xp    = psych.xpEarned || 100;

        let savedReport;
        try {
          savedReport = await DebateReport.create({
            sessionId, userId: sess.userId, topic: sess.topic, aiPersonality: sess.aiPersonality,
            scores: result.scores, psychologicalBreakdown: psych,
            emotionTimeline: updated.emotionTimeline,
            fallaciesDetected: updated.fallaciesDetected,
            throwableEvents: updated.throwableEvents,
            conversationHistory: updated.conversationHistory,
            xpEarned: xp, createdAt: new Date()
          });

          await DebateSession.findOneAndUpdate({ sessionId },
            { status: 'completed', endedAt: new Date(), finalScores: result.scores, reportId: savedReport._id, xpEarned: xp }
          ).exec();
          
          await User.updateOne({ _id: sess.userId }, { $inc: { xp } }).exec();
        } catch (err) {
          console.error("Error saving debate end state:", err);
        }

        socket.emit('debate:complete', {
          report: psych, reportId: savedReport?._id,
          scores: result.scores, xpEarned: xp,
          emotionTimeline: updated.emotionTimeline,
          fallaciesDetected: updated.fallaciesDetected
        });
        activeSessions.delete(sessionId);
        socketToSession.delete(socket.id);
      }
    });


    socket.on('debate:throw_item', ({ sessionId, item, hit, position }) => {
      const sess = activeSessions.get(sessionId);
      if (!sess) return;
      sess.throwableEvents = sess.throwableEvents || [];
      sess.throwableEvents.push({ item, hit, timestamp: Date.now(), emotionalContext: 'real_time' });
      activeSessions.set(sessionId, sess);
      socket.emit('debate:throw_ack', { item, hit, aiReaction: hit ? 'verbal_retaliation' : 'ignore' });
    });


    socket.on('debate:mediapipe', ({ sessionId, metrics }) => {
      const sess = activeSessions.get(sessionId);
      if (sess) { sess.lastMediaPipe = metrics; activeSessions.set(sessionId, sess); }
    });


    socket.on('disconnect', () => {
      const sessionId = socketToSession.get(socket.id);
      if (!sessionId) return;
      const sess = activeSessions.get(sessionId);
      if (sess) {
        DebateSession.findOneAndUpdate({ sessionId }, { status: 'abandoned', endedAt: new Date() }).exec();
        activeSessions.delete(sessionId);
      }
      socketToSession.delete(socket.id);
    });
  });
}
