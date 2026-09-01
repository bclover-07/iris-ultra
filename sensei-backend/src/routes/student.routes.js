import { Router } from 'express';
import { verifyAccessToken } from '../middleware/auth.middleware.js';
import User from '../models/User.js';
import StudentProfile from '../models/StudentProfile.js';
import FocusSession from '../models/FocusSession.js';
import QuizAttempt from '../models/QuizAttempt.js';
import Doubt from '../models/Doubt.js';
import VoiceJournal from '../models/VoiceJournal.js';

const router = Router();
router.use(verifyAccessToken);

// Get Student Dashboard Data (5 Verified Signals + Risk Model)
router.get('/dashboard', async (req, res) => {
  try {
    let profile = await StudentProfile.findOne({ userId: req.user.userId });
    if (!profile) {
      profile = await StudentProfile.create({
        userId: req.user.userId,
        presenceConsistency: { score: 85, totalVerifiedMinutes: 30, verifiedSessionsCount: 2, streakDays: 2 },
        quizMastery: { score: 80, totalAnswered: 15, totalCorrect: 12 },
        studyPlanProgress: { score: 75, completedTasks: 6, totalTasks: 8 },
        wellness: { score: 90, breathingComplianceAvg: 92, ambientScoreAvg: 88, recentSentiment: 'positive' },
        engagement: { score: 85, mentorVoiceTurns: 8, doubtSessionsCount: 3, practiceSessionsCount: 1 },
        riskModel: { riskTier: 'low', riskScore: 12, topContributingFactors: ['Consistent daily presence', 'High answer accuracy'] }
      });
    }

    const recentFocus = await FocusSession.find({ userId: req.user.userId })
      .sort({ createdAt: -1 })
      .limit(3);

    const recentQuizzes = await QuizAttempt.find({ userId: req.user.userId })
      .sort({ createdAt: -1 })
      .limit(3);

    const recentDoubts = await Doubt.find({ userId: req.user.userId })
      .sort({ createdAt: -1 })
      .limit(3);

    const user = await User.findById(req.user.userId);

    res.json({
      student: {
        name: user?.name || 'Student',
        email: user?.email,
        department: user?.department || 'Computer Science',
        semester: user?.semester || 4,
        avatar: user?.avatar || 'avatar_1'
      },
      profile: {
        presenceConsistency: profile.presenceConsistency,
        quizMastery: profile.quizMastery,
        studyPlanProgress: profile.studyPlanProgress,
        wellness: profile.wellness,
        engagement: profile.engagement,
        riskModel: profile.riskModel,
        xp: profile.xp,
        level: profile.level,
        streak: profile.streak
      },
      recentActivity: {
        focusSessions: recentFocus,
        quizAttempts: recentQuizzes,
        doubts: recentDoubts
      }
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch dashboard data' });
  }
});

// Sync Verified Signals from on-device logs
router.post('/profile/sync', async (req, res) => {
  try {
    const {
      presenceDeltaMinutes,
      quizDeltaAnswered,
      quizDeltaCorrect,
      studyPlanCompleted,
      studyPlanTotal,
      wellnessBreathing,
      wellnessAmbient,
      mentorTurnsDelta,
      doubtTurnsDelta,
      practiceTurnsDelta,
      riskModelOutput,
      xpDelta
    } = req.body;

    let profile = await StudentProfile.findOne({ userId: req.user.userId });
    if (!profile) {
      profile = new StudentProfile({ userId: req.user.userId });
    }

    if (presenceDeltaMinutes) {
      profile.presenceConsistency.totalVerifiedMinutes += presenceDeltaMinutes;
      profile.presenceConsistency.verifiedSessionsCount += 1;
      profile.presenceConsistency.score = Math.min(100, Math.round(profile.presenceConsistency.score * 0.9 + 100 * 0.1));
      profile.presenceConsistency.lastVerifiedAt = new Date();
    }

    if (quizDeltaAnswered) {
      profile.quizMastery.totalAnswered += quizDeltaAnswered;
      profile.quizMastery.totalCorrect += (quizDeltaCorrect || 0);
      const acc = profile.quizMastery.totalAnswered > 0
        ? Math.round((profile.quizMastery.totalCorrect / profile.quizMastery.totalAnswered) * 100)
        : 80;
      profile.quizMastery.score = acc;
    }

    if (studyPlanTotal !== undefined) {
      profile.studyPlanProgress.completedTasks = studyPlanCompleted || 0;
      profile.studyPlanProgress.totalTasks = studyPlanTotal || 1;
      profile.studyPlanProgress.score = Math.round((profile.studyPlanProgress.completedTasks / Math.max(1, profile.studyPlanProgress.totalTasks)) * 100);
    }

    if (wellnessBreathing !== undefined) {
      profile.wellness.breathingComplianceAvg = Math.round(profile.wellness.breathingComplianceAvg * 0.7 + wellnessBreathing * 0.3);
    }
    if (wellnessAmbient !== undefined) {
      profile.wellness.ambientScoreAvg = Math.round(profile.wellness.ambientScoreAvg * 0.7 + wellnessAmbient * 0.3);
    }
    profile.wellness.score = Math.round((profile.wellness.breathingComplianceAvg + profile.wellness.ambientScoreAvg) / 2);

    if (mentorTurnsDelta) profile.engagement.mentorVoiceTurns += mentorTurnsDelta;
    if (doubtTurnsDelta) profile.engagement.doubtSessionsCount += doubtTurnsDelta;
    if (practiceTurnsDelta) profile.engagement.practiceSessionsCount += practiceTurnsDelta;

    const totalActions = profile.engagement.mentorVoiceTurns + profile.engagement.doubtSessionsCount + profile.engagement.practiceSessionsCount;
    profile.engagement.score = Math.min(100, 60 + Math.min(40, totalActions * 2));

    if (riskModelOutput) {
      profile.riskModel = {
        riskTier: riskModelOutput.riskTier || 'low',
        riskScore: riskModelOutput.riskScore || 10,
        topContributingFactors: riskModelOutput.topContributingFactors || ['Verified high attention', 'Consistent practice'],
        modelVersion: riskModelOutput.modelVersion || 'Hexagon-NPU-v3-ONNX',
        lastInferenceAt: new Date()
      };
    }

    if (xpDelta) {
      profile.xp += xpDelta;
      profile.level = Math.floor(profile.xp / 500) + 1;
    }

    await profile.save();
    res.json({ message: 'Profile synced successfully', profile });
  } catch (error) {
    console.error('Sync error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get Profile
router.get('/profile', async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).lean();
    let profile = await StudentProfile.findOne({ userId: req.user.userId }).lean();
    if (!profile) {
      profile = {
        presenceConsistency: { score: 85, totalVerifiedMinutes: 30, streakDays: 3 },
        quizMastery: { score: 80, totalAnswered: 15, totalCorrect: 12 },
        studyPlanProgress: { score: 75, completedTasks: 6, totalTasks: 8 },
        wellness: { score: 90, recentSentiment: 'positive' },
        engagement: { score: 85 },
        riskModel: { riskTier: 'low', riskScore: 10 },
        xp: 250,
        level: 1,
        streak: 3
      };
    }
    res.json({ user, profile });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update Profile
router.put('/profile', async (req, res) => {
  try {
    const { name, department, semester, interests, avatar } = req.body;
    const user = await User.findById(req.user.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    if (name) user.name = name;
    if (department) user.department = department;
    if (semester) user.semester = semester;
    if (interests) user.interests = interests;
    if (avatar) user.avatar = avatar;

    await user.save();
    res.json({ message: 'Profile updated', user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
