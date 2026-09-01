import { Router } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import StudentProfile from '../models/StudentProfile.js';
import { verifyAccessToken } from '../middleware/auth.middleware.js';

const router = Router();

const generateTokens = (user) => {
  const accessToken = jwt.sign(
    { userId: user._id, role: 'student', email: user.email, name: user.name },
    process.env.JWT_SECRET || 'sensei_ultra_secret_key_2026',
    { expiresIn: '7d' }
  );

  const refreshToken = jwt.sign(
    { userId: user._id },
    process.env.JWT_REFRESH_SECRET || 'sensei_ultra_refresh_key_2026',
    { expiresIn: '30d' }
  );

  return { accessToken, refreshToken };
};

// Register Student
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, department, semester, interests } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email and password are required' });
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(409).json({ error: 'An account with this email already exists' });
    }

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password,
      role: 'student',
      department: department || 'Computer Science',
      semester: semester || 4,
      interests: interests || ['Artificial Intelligence', 'Full Stack Development']
    });

    // Create Initial Student Profile with observed defaults
    await StudentProfile.create({
      userId: user._id,
      presenceConsistency: { score: 88, totalVerifiedMinutes: 45, verifiedSessionsCount: 3, streakDays: 3 },
      quizMastery: { score: 82, totalAnswered: 24, totalCorrect: 20 },
      studyPlanProgress: { score: 70, completedTasks: 7, totalTasks: 10 },
      wellness: { score: 92, breathingComplianceAvg: 95, ambientScoreAvg: 90, recentSentiment: 'motivated' },
      engagement: { score: 85, mentorVoiceTurns: 12, doubtSessionsCount: 4, practiceSessionsCount: 2 },
      riskModel: { riskTier: 'low', riskScore: 10, topContributingFactors: ['High quiz consistency', 'Active mentor participation'] }
    });

    const { accessToken, refreshToken } = generateTokens(user);
    user.refreshToken = refreshToken;
    user.lastLogin = new Date();
    await user.save();

    res.status(201).json({
      message: 'Student registered successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: 'student',
        department: user.department,
        semester: user.semester,
        avatar: user.avatar
      },
      accessToken,
      refreshToken
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: error.message || 'Registration failed' });
  }
});

// Login Student
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const { accessToken, refreshToken } = generateTokens(user);
    user.refreshToken = refreshToken;
    user.lastLogin = new Date();
    await user.save();

    res.json({
      message: 'Login successful',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: 'student',
        department: user.department,
        semester: user.semester,
        avatar: user.avatar
      },
      accessToken,
      refreshToken
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: error.message || 'Login failed' });
  }
});

// Refresh Token
router.post('/refresh', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Refresh token missing' });

    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET || 'sensei_ultra_refresh_key_2026');
    const user = await User.findById(decoded.userId);
    if (!user) return res.status(401).json({ error: 'User not found' });

    const { accessToken, refreshToken } = generateTokens(user);
    res.json({ accessToken, refreshToken });
  } catch (error) {
    res.status(403).json({ error: 'Invalid refresh token' });
  }
});

// Get Current User Profile
router.get('/me', verifyAccessToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const profile = await StudentProfile.findOne({ userId: req.user.userId });

    res.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: 'student',
        department: user.department,
        semester: user.semester,
        avatar: user.avatar,
        interests: user.interests,
        skills: user.skills
      },
      profile
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
