import { Router } from 'express';
import { verifyAccessToken } from '../middleware/auth.middleware.js';
import { requireRole } from '../middleware/role.middleware.js';
import CareerSimulation from '../models/CareerSimulation.js';
import { runCareerSimulator } from '../agents/careerSimulator.agent.js';

const router = Router();

router.post('/simulate', verifyAccessToken, requireRole('student'), async (req, res) => {
  try {
    const { interests, cgpa, skills, targetCompanies, currentSemester } = req.body;
    if (!interests?.length) return res.status(400).json({ error: 'Provide at least one interest' });

    let riskTier = 'low';
    try {
      const { getStudentPerformance } = await import('../services/performance.service.js');
      const perf = await getStudentPerformance(req.user.userId);
      riskTier = perf?.risk?.tier || 'low';
    } catch (perfErr) {
      console.warn('[Career] Performance data unavailable, using default riskTier:', perfErr.message);
    }

    const result = await runCareerSimulator({
      interests, cgpa: cgpa || 0, skills: skills || [],
      targetCompanies: targetCompanies || [], semester: currentSemester || 1,
      riskTier
    });

    const simulation = await CareerSimulation.create({
      studentId: req.user.userId,
      inputs: { interests, cgpa, skills, targetCompanies, currentSemester },
      trajectories: result.trajectories || [],
      marketInsights: result.marketInsights || {},
      resumeMatch: result.resumeMatch || {}
    });

    res.json({ simulationId: simulation._id, trajectories: result.trajectories, marketInsights: result.marketInsights, resumeMatch: result.resumeMatch });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/history', verifyAccessToken, requireRole('student'), async (req, res) => {
  try {
    const simulations = await CareerSimulation.find({ studentId: req.user.userId }).sort({ createdAt: -1 }).limit(10);
    res.json({ simulations });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
