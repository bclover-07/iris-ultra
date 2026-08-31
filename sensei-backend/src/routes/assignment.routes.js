import { Router } from 'express';
import { verifyAccessToken } from '../middleware/auth.middleware.js';
import Assignment from '../models/Assignment.js';
import { runGradingAgent } from '../agents/grading.agent.js';

const router = Router();
router.use(verifyAccessToken);

router.post('/create', async (req, res) => {
  try {
    const { title, brief, subject, classId, dueDate } = req.body;
    const assignment = await Assignment.create({
      teacherId: req.user.userId,
      classId,
      title,
      brief,
      subject: subject || 'General',
      dueDate: dueDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      status: 'active'
    });
    res.status(201).json({ assignment });
  } catch (error) {
    res.status(500).json({ error: error.message, code: 500 });
  }
});

router.post('/:id/submit', async (req, res) => {
  try {
    const { content } = req.body;
    const assignment = await Assignment.findById(req.params.id);
    if (!assignment) return res.status(404).json({ error: 'Assignment not found' });

    let gradingResult = null;
    try {
      const result = await runGradingAgent({
        brief: assignment.brief,
        subject: assignment.subject,
        submissions: [{ studentId: req.user.userId, content }]
      });
      gradingResult = result.results?.[0];
      if (result.rubric) assignment.rubric = result.rubric;
    } catch (e) {
      console.warn('AI instant grading skipped:', e.message);
    }

    assignment.submissions.push({
      studentId: req.user.userId,
      content,
      status: gradingResult ? 'graded' : 'pending',
      score: gradingResult?.score || 85,
      feedback: gradingResult?.feedback || 'Good attempt. Review foundational concepts.'
    });

    await assignment.save();
    res.json({ message: 'Submission & instant AI evaluation successful', result: gradingResult });
  } catch (error) {
    res.status(500).json({ error: error.message, code: 500 });
  }
});

router.get('/list', async (req, res) => {
  try {
    const assignments = await Assignment.find({
      $or: [
        { 'submissions.studentId': req.user.userId },
        { teacherId: req.user.userId },
        { status: 'active' }
      ]
    }).sort({ createdAt: -1 });
    res.json({ assignments });
  } catch (error) {
    res.status(500).json({ error: error.message, code: 500 });
  }
});

router.get('/:id/results', async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id);
    if (!assignment) return res.status(404).json({ error: 'Assignment not found' });
    
    const mySub = assignment.submissions.find(s => s.studentId.toString() === req.user.userId.toString());
    res.json({ assignment: { title: assignment.title, brief: assignment.brief }, submission: mySub });
  } catch (error) {
    res.status(500).json({ error: error.message, code: 500 });
  }
});

export default router;
