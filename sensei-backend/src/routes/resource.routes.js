import { Router } from 'express';
import { verifyAccessToken } from '../middleware/auth.middleware.js';
import Subject from '../models/Subject.js';
import Marks from '../models/Marks.js';

const router = Router();
router.use(verifyAccessToken);

router.get('/recommendations', async (req, res) => {
  try {
    const marks = await Marks.find({ studentId: req.user.userId });
    const weakSubjects = marks.filter(m => (m.percentage || 0) < 60).map(m => m.subject);

    const recommendations = weakSubjects.length > 0
      ? weakSubjects.map(s => `Dedicate 45 minutes daily to ${s} video walkthroughs and flashcard reviews.`)
      : ['Maintain your current study cadence across all subjects.', 'Engage in peer discussion in the 3D Virtual World.'];

    res.json({
      recommendations,
      focusAreas: weakSubjects,
      efficiencyScore: 88
    });
  } catch (error) {
    res.status(500).json({ error: error.message, code: 500 });
  }
});

export default router;
