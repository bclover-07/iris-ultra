import { Router } from 'express';
import { verifyAccessToken } from '../middleware/auth.middleware.js';
import StudyPlan from '../models/StudyPlan.js';
import StudentProfile from '../models/StudentProfile.js';
import { callGeminiJSON, callGemini } from '../services/gemini.service.js';

const router = Router();
router.use(verifyAccessToken);

// POST /api/study-plan/generate (Generate day-by-day plan using Local Model)
router.post('/generate', async (req, res) => {
  try {
    const { syllabusText, targetDays, hoursPerDay, focusSubject, youtubeUrl } = req.body;

    const prompt = `Generate a structured, day-by-day study plan:
Subject: ${focusSubject || 'Computer Science & Engineering'}
Days: ${targetDays || 7}
Daily Study Target: ${hoursPerDay || 2.5} hours
Syllabus / Context: ${syllabusText || youtubeUrl || 'Core academic concepts, data structures, and practical coding exercises'}`;

    const generated = await callGeminiJSON(prompt, {
      systemPrompt: 'You are an expert academic curriculum designer generating daily checklists for accelerated learning.'
    });

    const days = (generated.days || []).map((d, i) => ({
      dayNumber: d.dayNumber || (i + 1),
      topic: d.topic || `Topic ${i + 1}`,
      tasks: (d.tasks || []).map(t => typeof t === 'string' ? { title: t, durationMinutes: 45, completed: false } : { title: t.title, durationMinutes: t.durationMinutes || 45, completed: false })
    }));

    const totalTasks = days.reduce((acc, d) => acc + d.tasks.length, 0);

    const plan = await StudyPlan.create({
      userId: req.user.userId,
      title: generated.title || `${focusSubject || 'Exam'} Mastery Plan`,
      subject: focusSubject || 'General',
      durationDays: generated.durationDays || targetDays || 7,
      estimatedHoursPerDay: generated.estimatedHoursPerDay || hoursPerDay || 2.5,
      days,
      totalTasks,
      completedTasks: 0,
      isActive: true
    });

    // Link active plan to student profile
    let profile = await StudentProfile.findOne({ userId: req.user.userId });
    if (profile) {
      profile.studyPlanProgress.activePlanId = plan._id;
      profile.studyPlanProgress.totalTasks = totalTasks;
      profile.studyPlanProgress.completedTasks = 0;
      profile.studyPlanProgress.score = 0;
      await profile.save();
    }

    res.status(201).json(plan);
  } catch (error) {
    console.error('Study plan generate error:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/study-plan/active
router.get('/active', async (req, res) => {
  try {
    let plan = await StudyPlan.findOne({ userId: req.user.userId, isActive: true }).sort({ createdAt: -1 });
    if (!plan) {
      plan = await StudyPlan.create({
        userId: req.user.userId,
        title: '7-Day Sprint: On-Device AI & Algorithms',
        subject: 'Computer Science',
        durationDays: 7,
        estimatedHoursPerDay: 2.5,
        days: [
          { dayNumber: 1, topic: 'Hexagon NPU & LiteRT Basics', tasks: [{ title: 'Review QNN compilation workflow', durationMinutes: 45, completed: true }, { title: 'Run baseline benchmark sparkline test', durationMinutes: 45, completed: true }] },
          { dayNumber: 2, topic: 'MediaPipe & Pose Landmarkers', tasks: [{ title: 'Verify pose coordinate tracking loop', durationMinutes: 60, completed: true }, { title: 'Calibrate 4-7-8 breathing compliance', durationMinutes: 30, completed: false }] },
          { dayNumber: 3, topic: 'DocLayout-YOLO Notebook Scanning', tasks: [{ title: 'Test diagram bounding box selector', durationMinutes: 60, completed: false }, { title: 'Formula LaTeX typesetting check', durationMinutes: 45, completed: false }] },
          { dayNumber: 4, topic: 'Camo Quizo & Hand Pose Classifier', tasks: [{ title: 'Train 21-landmark gesture mapping', durationMinutes: 60, completed: false }, { title: 'Play 5 gesture-based quiz rounds', durationMinutes: 30, completed: false }] },
          { dayNumber: 5, topic: 'Three.js 3D Virtual Hub Integration', tasks: [{ title: 'Test avatar movement in embedded WebView', durationMinutes: 60, completed: false }, { title: 'Simulate multiplayer quiz battle', durationMinutes: 45, completed: false }] },
          { dayNumber: 6, topic: 'Practice Area (Interview & Debate)', tasks: [{ title: '10-turn AI Mock Interview session', durationMinutes: 45, completed: false }, { title: 'Debate Arena rebuttal drills', durationMinutes: 45, completed: false }] },
          { dayNumber: 7, topic: 'Final Sprint Review & Milestone Lock', tasks: [{ title: 'Full end-to-end rehearsal', durationMinutes: 60, completed: false }, { title: 'Check all 5 verified dashboard metrics', durationMinutes: 30, completed: false }] }
        ],
        totalTasks: 14,
        completedTasks: 3,
        isActive: true
      });
    }
    res.json(plan);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PATCH /api/study-plan/toggle-task
router.patch('/toggle-task', async (req, res) => {
  try {
    const { planId, dayNumber, taskIndex } = req.body;
    const plan = await StudyPlan.findOne({ _id: planId, userId: req.user.userId });
    if (!plan) return res.status(404).json({ error: 'Plan not found' });

    const day = plan.days.find(d => d.dayNumber === dayNumber);
    if (!day || !day.tasks[taskIndex]) return res.status(400).json({ error: 'Task not found' });

    day.tasks[taskIndex].completed = !day.tasks[taskIndex].completed;

    let completed = 0;
    let total = 0;
    plan.days.forEach(d => {
      d.tasks.forEach(t => {
        total++;
        if (t.completed) completed++;
      });
    });

    plan.completedTasks = completed;
    plan.totalTasks = total;
    await plan.save();

    let profile = await StudentProfile.findOne({ userId: req.user.userId });
    if (profile) {
      profile.studyPlanProgress.completedTasks = completed;
      profile.studyPlanProgress.totalTasks = total;
      profile.studyPlanProgress.score = Math.round((completed / Math.max(1, total)) * 100);
      profile.xp += 10;
      await profile.save();
    }

    res.json({
      message: 'Task updated',
      plan,
      progress: {
        completed,
        total,
        percentage: Math.round((completed / Math.max(1, total)) * 100)
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
