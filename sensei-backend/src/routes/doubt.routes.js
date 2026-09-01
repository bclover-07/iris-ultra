import { Router } from 'express';
import { verifyAccessToken } from '../middleware/auth.middleware.js';
import Doubt from '../models/Doubt.js';
import StudentProfile from '../models/StudentProfile.js';
import { callGeminiJSON, callGemini } from '../services/gemini.service.js';

const router = Router();
router.use(verifyAccessToken);

// POST /api/doubt/solve (Solve multimodal doubt from notebook scan, photo, or text using local model)
router.post('/solve', async (req, res) => {
  try {
    const {
      question,
      subject,
      inputMode, // 'notebook_scanner', 'camera_ocr', 'voice', 'text'
      extractedOcrText,
      scannedBoundingBox,
      isFormula
    } = req.body;

    const queryText = extractedOcrText || question || 'Explain how to solve this theorem step by step.';

    const prompt = `Solve this academic doubt with step-by-step clarity and LaTeX formula notation:
Subject: ${subject || 'Mathematics / Physics / Computer Science'}
Input Mode: ${inputMode || 'notebook_scanner'}
Formula Mode: ${isFormula ? 'Yes' : 'No'}
Doubt Content: ${queryText}`;

    const solution = await callGeminiJSON(prompt, {
      systemPrompt: 'You are an expert STEM professor delivering step-by-step problem breakdowns with verified formula notation.'
    });

    const doubt = await Doubt.create({
      userId: req.user.userId,
      question: queryText,
      subject: solution.detectedTopic || subject || 'STEM',
      inputMode: inputMode || 'text',
      solution: solution.summary || 'Solved',
      steps: solution.steps || [],
      finalAnswer: solution.finalAnswer || '',
      keyTakeaway: solution.keyTakeaway || '',
      difficulty: solution.difficulty || 'Medium'
    });

    // Update Student Profile Engagement and Weak Topics
    let profile = await StudentProfile.findOne({ userId: req.user.userId });
    if (profile) {
      profile.engagement.doubtSessionsCount += 1;
      const topic = solution.detectedTopic || subject || 'General';
      if (!profile.quizMastery.weakTopics.includes(topic)) {
        profile.quizMastery.weakTopics.push(topic);
      }
      profile.xp += 15;
      await profile.save();
    }

    res.json({
      doubtId: doubt._id,
      ...solution
    });
  } catch (error) {
    console.error('Doubt solve error:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/doubt/history
router.get('/history', async (req, res) => {
  try {
    const doubts = await Doubt.find({ userId: req.user.userId })
      .sort({ createdAt: -1 })
      .limit(10);
    res.json(doubts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
