import User from '../models/User.js';
import StudentProfile from '../models/StudentProfile.js';
import FocusSession from '../models/FocusSession.js';
import QuizAttempt from '../models/QuizAttempt.js';
import Doubt from '../models/Doubt.js';
import VoiceJournal from '../models/VoiceJournal.js';

export const getDashboard = async (req, res) => {
  try {
    const userId = req.user.userId;
    let profile = await StudentProfile.findOne({ userId });
    if (!profile) {
      profile = await StudentProfile.create({
        userId,
        presenceConsistency: { score: 85, totalVerifiedMinutes: 30, verifiedSessionsCount: 2, streakDays: 2 },
        quizMastery: { score: 80, totalAnswered: 15, totalCorrect: 12 },
        studyPlanProgress: { score: 75, completedTasks: 6, totalTasks: 8 },
        wellness: { score: 90, breathingComplianceAvg: 92, ambientScoreAvg: 88, recentSentiment: 'positive' },
        engagement: { score: 85, mentorVoiceTurns: 8, doubtSessionsCount: 3, practiceSessionsCount: 1 },
        riskModel: { riskTier: 'low', riskScore: 12, topContributingFactors: ['Consistent daily presence', 'High answer accuracy'] },
        xp: 250,
        level: 1,
        streak: 3
      });
    }

    const user = await User.findById(userId);

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
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    const profile = await StudentProfile.findOne({ userId: req.user.userId });
    res.json({ user, profile });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateProfile = async (req, res) => {
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
};

export default { getDashboard, getProfile, updateProfile };
