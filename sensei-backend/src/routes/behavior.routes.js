import { Router } from 'express';
import { verifyAccessToken } from '../middleware/auth.middleware.js';
import BehaviorFingerprint from '../models/BehaviorFingerprint.js';
import User from '../models/User.js';
import Attendance from '../models/Attendance.js';
import Marks from '../models/Marks.js';
import HelpTicket from '../models/HelpTicket.js';
import Student from '../models/Student.js';
import { runBehaviorFingerprint } from '../agents/behaviorFingerprint.agent.js';

const router = Router();
router.use(verifyAccessToken);

router.get('/my-fingerprint', async (req, res) => {
  try {
    const student = await Student.findOne({ userId: req.user.userId });
    const user = await User.findById(req.user.userId);
    const attendance = await Attendance.findOne({ studentId: req.user.userId });
    const marks = await Marks.findOne({ studentId: req.user.userId });
    const helpTickets = await HelpTicket.countDocuments({ studentId: req.user.userId });

    const studentSignals = {
      attendancePattern: attendance?.percentage || 85,
      quizVelocity: marks?.percentage || 80,
      wellnessScore: 82,
      helpFrequency: helpTickets,
      studyDuration: student?.totalStudyTime || 120
    };

    const fingerprint = {
      studentId: req.user.userId,
      name: user?.name,
      signals: studentSignals,
      profileType: (marks?.percentage || 80) > 75 ? 'Deep Conceptual Master' : 'Practice-Oriented Learner',
      recommendedSchedule: 'Morning 9-11 AM deep focus; Afternoon 3-4 PM active recall quiz practice.',
      badges: student?.badges || ['🧠 Deep Thinker', '🎯 Laser Focus']
    };

    res.json({ fingerprint });
  } catch (error) {
    res.status(500).json({ error: error.message, code: 500 });
  }
});

router.post('/analyze', async (req, res) => {
  try {
    const language = req.body.language || 'en';
    const user = await User.findById(req.user.userId);
    const attendance = await Attendance.findOne({ studentId: req.user.userId });
    const marks = await Marks.findOne({ studentId: req.user.userId });

    const studentData = [{
      studentId: req.user.userId,
      name: user?.name || 'Student',
      signals: {
        attendancePattern: attendance?.percentage || 85,
        quizVelocity: marks?.percentage || 80,
        wellnessScore: 80,
        helpFrequency: 1,
        studyDuration: 100
      }
    }];

    const result = await runBehaviorFingerprint({
      classId: user?.department || 'CSE',
      students: studentData,
      language
    });

    res.json({ result });
  } catch (error) {
    res.status(500).json({ error: error.message, code: 500 });
  }
});

export default router;
