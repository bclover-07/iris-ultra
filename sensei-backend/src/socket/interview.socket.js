import InterviewSession from '../models/InterviewSession.js';
import InterviewReport from '../models/InterviewReport.js';
import User from '../models/User.js';
import Student from '../models/Student.js';
import { getInterviewGraph, resumeContextLoader } from '../agents/virtualInterview.agent.js';
import { generatePDFReport } from '../utils/pdfReportGenerator.js';

const activeSessions = new Map();
const socketToSession = new Map();

function getSession(sessionId) { return activeSessions.get(sessionId); }

function updateSessionScores(sessionId, turnScores) {
  const sess = activeSessions.get(sessionId);
  if (!sess) return;
  sess.sessionScoreHistory = sess.sessionScoreHistory || [];
  sess.sessionScoreHistory.push(turnScores);
  const hist = sess.sessionScoreHistory;
  Object.keys(turnScores).forEach(k => {
    const vals = hist.map(h => h[k]).filter(v => v != null);
    if (vals.length) sess.scores[k] = vals.reduce((a, b) => a + b, 0) / vals.length;
  });
  const scoreVals = Object.values(sess.scores).filter(v => typeof v === 'number' && v > 0);
  sess.scores.overall = scoreVals.length > 0 ? scoreVals.reduce((a, b) => a + b, 0) / scoreVals.length : 0;
  activeSessions.set(sessionId, sess);
}

export default function setupInterviewSocket(io) {
  const ns = io.of('/interview');

  ns.on('connection', (socket) => {

    socket.on('interview:start', async ({ sessionId, userId, jobRole, company, mode, difficulty, resumeData }) => {
      try {
        const state = {
          sessionId, userId, jobRole, company, mode,
          difficulty: difficulty || 1,
          adaptiveDifficulty: difficulty || 1,
          conversationHistory: [],
          sessionScoreHistory: [],
          currentQuestion: null,
          questionIndex: 0,
          totalQuestions: mode === 'stress' ? 12 : 10,
          phase: 'intro',
          resumeData: resumeData || {},
          resumeAnalysis: null,
          scores: { technical: 0, communication: 0, confidence: 0, eyeContact: 0, posture: 0, fluency: 0, sentiment: 0, overall: 0 },
          startedAt: Date.now(),
          lastActivityAt: Date.now(),
          questionHistory: [],
          shouldEnd: false,
          sessionXPEarned: 0
        };

        if (resumeData && Object.keys(resumeData).length > 0) {
          try {
            const withResume = await resumeContextLoader({ ...state });
            state.resumeAnalysis = withResume.resumeAnalysis;
          } catch (e) {
            console.error('Resume analysis error:', e.message);
          }
        }

        activeSessions.set(sessionId, state);
        socketToSession.set(socket.id, sessionId);
        socket.join(sessionId);

        InterviewSession.create({
          sessionId, userId, jobRole, company, mode, difficulty: state.adaptiveDifficulty,
          startedAt: new Date(), status: 'active'
        }).catch(e => console.error('Session create error:', e.message));

        const interviewGraph = getInterviewGraph();
        let openingState;
        try {
          openingState = await interviewGraph.invoke({
            ...state,
            studentAnswer: `Hello, I am ready for my ${jobRole} interview at ${company}.`,
            wordTimestamps: [],
            mediaPipeData: { eyeContactScore: 0.8, postureScore: 0.8, expressionState: 'neutral' },
            clientNLP: { sentiment: { label: 'POSITIVE', score: 0.8 }, emotion: 'neutral', clarity: 0.8 }
          });
        } catch (e) {
          console.error('Opening question generation error:', e.message);
          openingState = {
            nextQuestion: {
              text: `Welcome! Let's start. Tell me about yourself and why you're interested in the ${jobRole} role at ${company}.`,
              type: 'behavioral', topic: 'introduction', difficulty: 'easy',
              expectedKeywords: ['experience', 'skills', 'motivation', 'background', 'goals'],
              followUp: false
            },
            aiResponse: `Welcome to your ${mode} interview for ${jobRole} at ${company}. I'll be evaluating you today. Let's begin. Tell me about yourself and why you're interested in this role.`
          };
        }

        state.currentQuestion = openingState.nextQuestion;
        state.conversationHistory.push({
          role: 'question', text: openingState.nextQuestion?.text,
          topic: openingState.nextQuestion?.topic, timestamp: Date.now()
        });
        activeSessions.set(sessionId, state);

        socket.emit('interview:ai_response', {
          text: openingState.aiResponse,
          question: openingState.nextQuestion,
          reactionType: 'neutral',
          feedbackNote: null,
          phase: 'intro',
          questionIndex: 0,
          totalQuestions: state.totalQuestions
        });
      } catch (err) {
        console.error('interview:start error:', err.message);
        socket.emit('interview:error', { message: 'Failed to start interview session' });
      }
    });

    socket.on('interview:answer', async ({ sessionId, transcript, wordTimestamps, duration, mediaPipeData, clientNLP }) => {
      const sess = getSession(sessionId);
      if (!sess) { socket.emit('interview:error', { message: 'Session not found' }); return; }

      socket.emit('interview:thinking', { state: 'analyzing' });

      sess.conversationHistory.push({ role: 'user', text: transcript, timestamp: Date.now() });
      sess.lastActivityAt = Date.now();

      const graphInput = {
        ...sess,
        studentAnswer: transcript,
        wordTimestamps: wordTimestamps || [],
        mediaPipeData: mediaPipeData || {},
        clientNLP: clientNLP || {},
        sessionScoreHistory: sess.sessionScoreHistory || []
      };

      let result;
      try {
        const interviewGraph = getInterviewGraph();
        result = await interviewGraph.invoke(graphInput);
      } catch (e) {
        console.error('LangGraph error:', e.message);
        socket.emit('interview:error', { message: 'AI processing error, please continue' });
        return;
      }

      if (result.turnScores) updateSessionScores(sessionId, result.turnScores);
      sess.currentQuestion = result.nextQuestion;
      sess.questionIndex = result.questionIndex;
      sess.phase = result.phase;
      sess.adaptiveDifficulty = result.adaptiveDifficulty;
      sess.shouldEnd = result.shouldEnd;
      if (result.nextQuestion) {
        sess.conversationHistory.push({
          role: 'question', text: result.nextQuestion.text,
          topic: result.nextQuestion.topic, timestamp: Date.now()
        });
        sess.questionHistory.push(result.nextQuestion.topic);
      }
      activeSessions.set(sessionId, sess);

      socket.emit('interview:ai_response', {
        text: result.aiResponse,
        question: result.nextQuestion,
        reactionType: result.reactionType,
        feedbackNote: result.feedbackNote,
        phase: result.phase,
        questionIndex: result.questionIndex,
        totalQuestions: sess.totalQuestions,
        turnScores: result.turnScores,
        adaptiveDifficulty: result.adaptiveDifficulty
      });

      if (result.shouldEnd && result.finalReport) {
        socket.emit('interview:thinking', { state: 'generating_report' });
        const report = result.finalReport;
        const xpEarned = Math.round((report.scores?.overall || 0.5) * 200);
        sess.sessionXPEarned = xpEarned;

        try {
          const savedReport = await InterviewReport.create({
            sessionId, userId: sess.userId, jobRole: sess.jobRole, company: sess.company,
            mode: sess.mode, scores: report.scores, verdict: report.overallVerdict,
            strengths: report.strengths, improvements: report.improvements,
            weeklyActionPlan: report.weeklyActionPlan, readinessLevel: report.readinessLevel,
            companyFitScore: report.companyFitScore, recommendedRoles: report.recommendedRoles,
            conversationHistory: sess.conversationHistory,
            keyLearningResources: report.keyLearningResources,
            xpEarned, createdAt: new Date()
          });

          InterviewSession.findOneAndUpdate({ sessionId },
            { status: 'completed', endedAt: new Date(), finalScores: report.scores, reportId: savedReport._id, xpEarned }
          ).exec().catch(() => {});

          Student.findOneAndUpdate({ userId: sess.userId }, { $inc: { xp: xpEarned } }, { new: true }).exec().then(student => {
            if (student?.classId) {
              import('../services/leaderboard.service.js').then((service) => {
                service.recalculateLeaderboard(student.classId);
              });
            }
          }).catch(() => {});

          let pdfBase64 = '';
          try {
            const pdfBuffer = await generatePDFReport({
              ...report, sessionId, jobRole: sess.jobRole, company: sess.company, scores: report.scores
            });
            pdfBase64 = pdfBuffer.toString('base64');
          } catch (pdfErr) {
            console.error('PDF generation error:', pdfErr.message);
          }

          socket.emit('interview:complete', {
            report, reportId: savedReport._id, xpEarned, pdfBase64, scores: report.scores
          });
        } catch (dbErr) {
          console.error('Report save error:', dbErr.message);
          socket.emit('interview:complete', {
            report, reportId: null, xpEarned, pdfBase64: '', scores: report.scores
          });
        }

        activeSessions.delete(sessionId);
        socketToSession.delete(socket.id);
      }
    });

    socket.on('interview:mediapipe_update', ({ sessionId, metrics }) => {
      const sess = getSession(sessionId);
      if (sess) {
        sess.lastMediaPipe = metrics;
        activeSessions.set(sessionId, sess);
      }
    });

    socket.on('interview:end_early', async ({ sessionId }) => {
      const sess = getSession(sessionId);
      if (!sess) { socket.emit('interview:error', { message: 'Session not found' }); return; }

      socket.emit('interview:thinking', { state: 'generating_report' });

      sess.shouldEnd = true;

      const graphInput = {
        ...sess,
        studentAnswer: 'Thank you. I would like to end the interview now.',
        wordTimestamps: [],
        mediaPipeData: sess.lastMediaPipe || {},
        clientNLP: {},
        sessionScoreHistory: sess.sessionScoreHistory || []
      };

      let result;
      try {
        const interviewGraph = getInterviewGraph();
        result = await interviewGraph.invoke(graphInput);
      } catch (e) {
        console.error('LangGraph early exit error:', e.message);
        socket.emit('interview:error', { message: 'Error generating early exit report' });
        return;
      }

      if (result.turnScores) updateSessionScores(sessionId, result.turnScores);

      const report = result.finalReport || {
        scores: sess.scores,
        overallVerdict: 'Interview ended early by user. Partial feedback report generated.',
        strengths: ['Started the interview'],
        improvements: ['Complete the full interview session next time to get comprehensive feedback.'],
        weeklyActionPlan: [{ week: 1, focus: 'Complete full interviews', tasks: ['Practice sessions'], resources: [] }],
        readinessLevel: sess.scores.overall > 0.7 ? 'almost_ready' : 'needs_work',
        companyFitScore: Math.round(sess.scores.overall * 100),
        recommendedRoles: [sess.jobRole],
        keyLearningResources: []
      };

      const xpEarned = Math.round((report.scores?.overall || 0.5) * 100);
      sess.sessionXPEarned = xpEarned;

      try {
        const savedReport = await InterviewReport.create({
          sessionId, userId: sess.userId, jobRole: sess.jobRole, company: sess.company,
          mode: sess.mode, scores: report.scores || sess.scores, verdict: report.overallVerdict,
          strengths: report.strengths, improvements: report.improvements,
          weeklyActionPlan: report.weeklyActionPlan, readinessLevel: report.readinessLevel,
          companyFitScore: report.companyFitScore, recommendedRoles: report.recommendedRoles,
          conversationHistory: sess.conversationHistory,
          keyLearningResources: report.keyLearningResources,
          xpEarned, createdAt: new Date()
        });

        await InterviewSession.findOneAndUpdate({ sessionId },
          { status: 'completed', endedAt: new Date(), finalScores: report.scores || sess.scores, reportId: savedReport._id, xpEarned }
        ).exec();

        const student = await Student.findOneAndUpdate({ userId: sess.userId }, { $inc: { xp: xpEarned } }, { new: true }).exec();
        if (student?.classId) {
          const service = await import('../services/leaderboard.service.js');
          await service.recalculateLeaderboard(student.classId);
        }

        let pdfBase64 = '';
        try {
          const pdfBuffer = await generatePDFReport({
            ...report, sessionId, jobRole: sess.jobRole, company: sess.company, scores: report.scores || sess.scores
          });
          pdfBase64 = pdfBuffer.toString('base64');
        } catch (pdfErr) {
          console.error('PDF generation error:', pdfErr.message);
        }

        socket.emit('interview:complete', {
          report, reportId: savedReport._id, xpEarned, pdfBase64, scores: report.scores || sess.scores
        });
      } catch (dbErr) {
        console.error('Early exit report save error:', dbErr.message);
        socket.emit('interview:complete', {
          report, reportId: null, xpEarned, pdfBase64: '', scores: report.scores || sess.scores
        });
      }

      activeSessions.delete(sessionId);
      socketToSession.delete(socket.id);
    });

    socket.on('disconnect', () => {
      const sessionId = socketToSession.get(socket.id);
      if (!sessionId) return;
      const sess = getSession(sessionId);
      if (sess) {
        InterviewSession.findOneAndUpdate({ sessionId },
          { status: 'abandoned', endedAt: new Date(), finalScores: sess.scores }
        ).exec().catch(() => {});
        activeSessions.delete(sessionId);
      }
      socketToSession.delete(socket.id);
    });

    socket.on('interview:ping', ({ sessionId }) => {
      const sess = getSession(sessionId);
      if (sess) { sess.lastActivityAt = Date.now(); activeSessions.set(sessionId, sess); }
      socket.emit('interview:pong');
    });
  });
}
