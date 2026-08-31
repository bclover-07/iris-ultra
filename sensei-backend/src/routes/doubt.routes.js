import { Router } from 'express';
import { verifyAccessToken } from '../middleware/auth.middleware.js';
import { requireRole } from '../middleware/role.middleware.js';
import Doubt from '../models/Doubt.js';
import HelpTicket from '../models/HelpTicket.js';
import getIO from '../config/socket.js';
import { runDoubtSolver } from '../agents/doubtSolver.agent.js';

const router = Router();

router.post('/solve', verifyAccessToken, requireRole('student'), async (req, res) => {
  try {
    const { inputType, transcription, ocrText, originalQuery, imageUrl } = req.body;
    const queryText = originalQuery || transcription || ocrText;
    if (!queryText) {
      return res.status(400).json({ error: 'Provide a query, transcription, or OCR text' });
    }

    const result = await runDoubtSolver({
      inputType: inputType || 'text',
      transcription: transcription || '',
      ocrText: ocrText || '',
      originalQuery: queryText
    });

    const confidenceScore = result.solution?.confidenceScore !== undefined ? result.solution.confidenceScore : 85;
    const fallbackActive = confidenceScore < 70;

    const doubt = await Doubt.create({
      studentId: req.user.userId,
      inputType: inputType || 'text',
      transcription: transcription || '',
      ocrText: ocrText || '',
      imageUrl: imageUrl || '',
      originalQuery: queryText,
      courseContext: result.courseContext || '',
      subject: result.subject || '',
      solution: result.solution || {},
      resolved: !fallbackActive
    });

    if (fallbackActive) {
      // Auto routing to teacher help queue
      const ticket = await HelpTicket.create({
        studentId: req.user.userId,
        message: `[AI Doubt Fallback] Student asked: "${queryText}". The AI responded with low confidence (Score: ${confidenceScore}%).`,
        category: 'doubt-solver',
        urgency: 'high',
        status: 'pending'
      });

      try {
        const populatedTicket = await HelpTicket.findById(ticket._id)
          .populate('studentId', 'name studentId email avatar');
        const io = getIO();
        io.of('/teacher').emit('help:new_ticket', populatedTicket);
      } catch (e) {
        console.error('Failed to emit help socket:', e.message);
      }
    }

    res.json({ 
      doubtId: doubt._id, 
      solution: result.solution, 
      subject: result.subject,
      fallbackActive,
      confidenceScore
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/history', verifyAccessToken, requireRole('student'), async (req, res) => {
  try {
    const doubts = await Doubt.find({ studentId: req.user.userId }).sort({ createdAt: -1 }).limit(20);
    res.json({ doubts });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
