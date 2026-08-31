import { Router } from 'express';
import { verifyAccessToken } from '../middleware/auth.middleware.js';
import Insight from '../models/Insight.js';
import Marks from '../models/Marks.js';
import User from '../models/User.js';

const router = Router();
router.use(verifyAccessToken);

router.get('/overview', async (req, res) => {
  try {
    const departments = await User.distinct('department');
    const overview = {};
    for (const dept of departments) {
      const students = await User.find({ department: dept, role: 'student' });
      const ids = students.map((s) => s._id);
      const insights = await Insight.find({ studentId: { $in: ids } });
      overview[dept] = {
        students: students.length,
        avgCgpa: insights.length > 0 ? (insights.reduce((s, i) => s + (i.cgpa || 0), 0) / insights.length).toFixed(2) : 0,
        atRisk: insights.filter((i) => ['high', 'critical'].includes(i.riskLevel)).length
      };
    }
    res.json({ overview });
  } catch (error) {
    res.status(500).json({ error: error.message, code: 500 });
  }
});

export default router;
