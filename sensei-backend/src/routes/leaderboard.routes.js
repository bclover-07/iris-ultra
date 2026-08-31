import { Router } from 'express';
import { verifyAccessToken } from '../middleware/auth.middleware.js';
import { getClassLeaderboard } from '../services/leaderboard.service.js';
import Leaderboard from '../models/Leaderboard.js';
import Student from '../models/Student.js';

const router = Router();
router.use(verifyAccessToken);

router.get('/class/:classId', async (req, res) => {
  try {
    const lb = await getClassLeaderboard(req.params.classId);
    res.json(lb || { entries: [], updatedAt: null });
  } catch (error) {
    res.status(500).json({ error: error.message, code: 500 });
  }
});

router.get('/global', async (req, res) => {
  try {
    const all = await Leaderboard.find();
    const allEntries = all.flatMap((lb) => lb.entries);
    allEntries.sort((a, b) => b.score - a.score);
    res.json({ entries: allEntries.slice(0, 50) });
  } catch (error) {
    res.status(500).json({ error: error.message, code: 500 });
  }
});

router.get('/my-rank', async (req, res) => {
  try {
    const student = await Student.findOne({ userId: req.user.userId });
    if (!student?.classId) return res.json({ rank: 0, totalStudents: 0, percentile: 0 });
    
    const lb = await getClassLeaderboard(student.classId);
    if (!lb) return res.json({ rank: 0, totalStudents: 0, percentile: 0 });
    
    const myEntry = lb.entries.find((e) => e.studentId.toString() === req.user.userId.toString());
    res.json({
      rank: myEntry?.rank || 0,
      totalStudents: lb.entries.length,
      percentile: myEntry ? Math.round((1 - myEntry.rank / lb.entries.length) * 100) : 0,
      score: myEntry?.score || 0,
      xp: myEntry?.xp || 0,
      badges: myEntry?.badges || []
    });
  } catch (error) {
    res.status(500).json({ error: error.message, code: 500 });
  }
});

export default router;
