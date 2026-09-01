import { Router } from 'express';
import { verifyAccessToken } from '../middleware/auth.middleware.js';
import DebateSession from '../models/DebateSession.js';
import DebateReport from '../models/DebateReport.js';
import StudentProfile from '../models/StudentProfile.js';
import { callGeminiJSON, callGemini } from '../services/gemini.service.js';

const router = Router();
router.use(verifyAccessToken);

const DEBATE_TOPICS = [
  { id: 't1', topic: 'Should on-device AI completely replace cloud inference for privacy-critical applications?', category: 'Technology', difficulty: 'Intermediate' },
  { id: 't2', topic: 'Is competitive algorithmic problem solving a true indicator of engineering capability?', category: 'Academia', difficulty: 'Easy' },
  { id: 't3', topic: 'Will specialized NPUs render general-purpose mobile GPUs obsolete for edge machine learning?', category: 'Hardware', difficulty: 'Hard' },
  { id: 't4', topic: 'Should university curricula mandate open-source contributions over traditional academic exams?', category: 'Education', difficulty: 'Easy' },
  { id: 't5', topic: 'Does high-frequency automated grading inhibit creative and divergent problem solving in students?', category: 'Ethics', difficulty: 'Intermediate' },
  { id: 't6', topic: 'Should biometric and camera-verified focus monitoring be standard in remote technical assessments?', category: 'Ethics & Privacy', difficulty: 'Medium' }
];

// GET /api/debate/topics (Debate Topic Bank)
router.get('/topics', async (req, res) => {
  try {
    res.json({ topics: DEBATE_TOPICS, count: DEBATE_TOPICS.length });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/debate/score-transcript (End-of-session cloud scoring on full debate transcript)
router.post('/score-transcript', async (req, res) => {
  try {
    const { topic, studentStance, turns, faceMeshConfidenceAvg } = req.body;

    const transcriptFormatted = (turns || []).map(t => `${t.speaker}: ${t.text}`).join('\n');

    const prompt = `Grade this student's performance in a timed debate:
Topic: ${topic}
Student Stance: ${studentStance || 'For'}
Full Transcript:
${transcriptFormatted}

Evaluate along 3 dimensions:
1. Claim clarity: Clear argument premises?
2. Rebuttal quality: Direct rebuttal to opponent?
3. Evidence structure: Logical persuasiveness?

Return JSON strictly:
{
  "claimClarityScore": number (0-100),
  "rebuttalQualityScore": number (0-100),
  "evidenceScore": number (0-100),
  "overallScore": number (0-100),
  "strengths": [string],
  "weaknesses": [string],
  "summary": string
}`;

    const score = await callGeminiJSON(prompt, {
      systemPrompt: 'You are an Oxford-style debate adjudicator scoring debate sessions.'
    });

    const report = await DebateReport.create({
      userId: req.user.userId,
      topic,
      studentStance: studentStance || 'For',
      scores: {
        claimClarity: score.claimClarityScore || 85,
        rebuttalQuality: score.rebuttalQualityScore || 82,
        evidence: score.evidenceScore || 80,
        overall: score.overallScore || 84,
        deliveryConfidence: Math.round((faceMeshConfidenceAvg || 0.88) * 100)
      },
      strengths: score.strengths || [],
      weaknesses: score.weaknesses || [],
      summary: score.summary || 'Strong debate performance.'
    });

    // Update Student Profile Engagement
    let profile = await StudentProfile.findOne({ userId: req.user.userId });
    if (profile) {
      profile.engagement.practiceSessionsCount += 1;
      profile.xp += 60;
      await profile.save();
    }

    res.json({
      reportId: report._id,
      ...score,
      deliveryConfidence: Math.round((faceMeshConfidenceAvg || 0.88) * 100)
    });
  } catch (error) {
    console.error('Debate scoring error:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/debate/history
router.get('/history', async (req, res) => {
  try {
    const reports = await DebateReport.find({ userId: req.user.userId })
      .sort({ createdAt: -1 })
      .limit(10);
    res.json(reports);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
