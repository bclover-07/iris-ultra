import { Router } from 'express';
import { verifyAccessToken } from '../middleware/auth.middleware.js';
import DropoutPrediction from '../models/DropoutPrediction.js';
import User from '../models/User.js';
import Insight from '../models/Insight.js';
import Marks from '../models/Marks.js';
import Attendance from '../models/Attendance.js';
import HelpTicket from '../models/HelpTicket.js';
import { runDropoutPrediction } from '../agents/dropoutPrediction.agent.js';

const router = Router();
router.use(verifyAccessToken);

router.get('/my-risk', async (req, res) => {
  try {
    let prediction = await DropoutPrediction.findOne({ studentId: req.user.userId }).sort({ createdAt: -1 });
    const insight = await Insight.findOne({ studentId: req.user.userId });
    
    if (!prediction && insight) {
      prediction = {
        riskScore: insight.dropoutScore || 15,
        confidence: 90,
        riskTier: insight.riskLevel || 'low',
        riskDrivers: [insight.riskReason || 'Consistent study engagement'],
        intervention: {
          recommendedAction: insight.recommendations?.[0] || 'Keep up the momentum',
          urgency: insight.riskLevel === 'critical' ? 'critical' : 'medium'
        }
      };
    }
    
    res.json({ prediction, insight });
  } catch (error) {
    res.status(500).json({ error: error.message, code: 500 });
  }
});

router.post('/self-evaluate', async (req, res) => {
  try {
    const student = await User.findById(req.user.userId);
    const helpTickets = await HelpTicket.find({ studentId: req.user.userId });
    const marks = await Marks.find({ studentId: req.user.userId });
    const attendance = await Attendance.find({ studentId: req.user.userId });
    
    const avgAttendance = attendance.length > 0
      ? Math.round(attendance.reduce((sum, a) => sum + (a.percentage || 75), 0) / attendance.length)
      : 85;

    const studentData = [{
      studentId: student._id,
      name: student.name,
      helpTickets: helpTickets.map(t => ({ message: t.message })),
      wellnessNotes: "Engaged in autonomous learning on Iris Plus platform.",
      attendanceVelocity: avgAttendance,
      submissionDelays: 0,
      cgpa: 8.0,
      helpFrequency: helpTickets.length
    }];

    const result = await runDropoutPrediction({ students: studentData });
    const pred = result.predictions?.[0];

    if (pred) {
      const saved = await DropoutPrediction.create({
        studentId: req.user.userId,
        riskScore: pred.riskScore,
        confidence: pred.confidence,
        riskTier: pred.riskTier,
        riskDrivers: pred.riskDrivers,
        intervention: pred.intervention
      });
      return res.json({ prediction: saved });
    }

    res.json({ message: 'Evaluation completed', result });
  } catch (error) {
    res.status(500).json({ error: error.message, code: 500 });
  }
});

export default router;
