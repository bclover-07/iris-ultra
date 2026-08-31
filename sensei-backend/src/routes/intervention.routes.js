import { Router } from 'express';
import { verifyAccessToken } from '../middleware/auth.middleware.js';
import Intervention from '../models/Intervention.js';

const router = Router();
router.use(verifyAccessToken);

router.get('/', async (req, res) => {
  try {
    const filter = {};
    if (req.user.role === 'student') filter.studentId = req.user.userId;
    if (req.user.role === 'teacher') filter.teacherId = req.user.userId;
    const interventions = await Intervention.find(filter)
      .populate('studentId', 'name studentId')
      .populate('teacherId', 'name')
      .sort({ createdAt: -1 });
    res.json({ interventions });
  } catch (error) {
    res.status(500).json({ error: error.message, code: 500 });
  }
});

router.patch('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const update = { status };
    if (status === 'viewed') update.viewedAt = new Date();
    if (status === 'resolved') update.resolvedAt = new Date();
    await Intervention.findByIdAndUpdate(req.params.id, update);
    res.json({ message: 'Status updated' });
  } catch (error) {
    res.status(500).json({ error: error.message, code: 500 });
  }
});

export default router;
