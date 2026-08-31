import express from 'express';
import crypto from 'crypto';
import { verifyAccessToken } from '../middleware/auth.middleware.js';
import DebateSession from '../models/DebateSession.js';
import DebateReport from '../models/DebateReport.js';

const router = express.Router();

router.use(verifyAccessToken);

router.post('/start', async (req, res) => {
  try {
    const { topic, aiPersonality, debateMode } = req.body;
    if (!topic) {
      return res.status(400).json({ error: 'Topic is required' });
    }
    const sessionId = `db_${crypto.randomUUID()}`;
    res.json({ sessionId, userId: req.user.userId, topic, aiPersonality: aiPersonality || 'aggressive_politician' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create debate session' });
  }
});

router.get('/', async (req, res) => {
  try {
    const sessions = await DebateSession.find({ userId: req.user._id })
      .sort({ startedAt: -1 })
      .populate('reportId', 'scores debateRank xpEarned');
    res.json({ success: true, sessions });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});


router.get('/report/:id', async (req, res) => {
  try {
    const report = await DebateReport.findById(req.params.id);
    if (!report) return res.status(404).json({ success: false, error: 'Report not found' });
    

    if (report.userId.toString() !== req.user._id.toString() && req.user.role === 'student') {
      return res.status(403).json({ success: false, error: 'Unauthorized' });
    }

    res.json({ success: true, report });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
