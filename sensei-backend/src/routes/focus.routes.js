import { Router } from 'express';
import { verifyAccessToken } from '../middleware/auth.middleware.js';
import { requireRole } from '../middleware/role.middleware.js';
import FocusSession from '../models/FocusSession.js';
import Student from '../models/Student.js';
import { runFocusGuardian } from '../agents/focusGuardian.agent.js';

const router = Router();

router.post('/session', verifyAccessToken, requireRole('student'), async (req, res) => {
  try {
    const { startTime, endTime, totalMinutes, focusedMinutes, distractions, environment } = req.body;

    const result = await runFocusGuardian({
      studentId: req.user.userId,
      totalMinutes: totalMinutes || 0,
      focusedMinutes: focusedMinutes || 0,
      distractions: distractions || [],
      environment: environment || {}
    });

    const session = await FocusSession.create({
      studentId: req.user.userId,
      startTime: new Date(startTime),
      endTime: new Date(endTime),
      totalMinutes, focusedMinutes,
      focusScore: result.focusScore || 0,
      distractions: distractions || [],
      environment: environment || {},
      fingerprint: result.fingerprint || {}
    });

    const xpGain = Math.round((result.focusScore || 0) * 0.5);
    if (xpGain > 0) {
      const student = await Student.findOneAndUpdate({ userId: req.user.userId }, { $inc: { xp: xpGain } }, { new: true });
      if (student?.classId) {
        import('../services/leaderboard.service.js').then((service) => {
          service.recalculateLeaderboard(student.classId);
        });
      }
    }

    res.json({ sessionId: session._id, focusScore: result.focusScore, fingerprint: result.fingerprint, badges: result.badges, xpGained: xpGain });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/stats', verifyAccessToken, requireRole('student'), async (req, res) => {
  try {
    const sessions = await FocusSession.find({ studentId: req.user.userId }).sort({ createdAt: -1 }).limit(30);
    const totalSessions = sessions.length;
    const avgFocus = totalSessions > 0 ? Math.round(sessions.reduce((s, se) => s + se.focusScore, 0) / totalSessions) : 0;
    const totalFocused = sessions.reduce((s, se) => s + se.focusedMinutes, 0);
    const latestFingerprint = sessions[0]?.fingerprint || {};

    res.json({ totalSessions, avgFocusScore: avgFocus, totalFocusedMinutes: totalFocused, fingerprint: latestFingerprint, recentSessions: sessions.slice(0, 10) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/leaderboard', verifyAccessToken, requireRole('student'), async (req, res) => {
  try {
    const pipeline = [
      { $group: { _id: '$studentId', avgScore: { $avg: '$focusScore' }, totalMinutes: { $sum: '$focusedMinutes' }, sessions: { $sum: 1 } } },
      { $sort: { avgScore: -1 } },
      { $limit: 20 },
      { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'user' } },
      { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } }
    ];
    const results = await FocusSession.aggregate(pipeline);
    const entries = results.map((r, i) => ({
      rank: i + 1, name: r.user?.name || 'Unknown', avgScore: Math.round(r.avgScore), totalMinutes: r.totalMinutes, sessions: r.sessions,
      isCurrentUser: r._id?.toString() === req.user.userId.toString()
    }));
    res.json({ entries });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
