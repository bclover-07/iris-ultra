import { Router } from 'express';
import { verifyAccessToken } from '../middleware/auth.middleware.js';
import VideoSummary from '../models/VideoSummary.js';
import { fetchTranscript } from '../utils/youtubeTranscript.js';
import { callGeminiJSON } from '../services/gemini.service.js';

const router = Router();
router.use(verifyAccessToken);

router.post('/summarise', async (req, res) => {
  try {
    const { videoUrl } = req.body;
    const transcript = await fetchTranscript(videoUrl);

    const prompt = `Analyze this video transcript:
${transcript.fullText.slice(0, 6000)}
Return JSON: { "title": "...", "summary": "3 paragraphs", "summaryCards": [{"title":"...","content":"...","emoji":"...","color":"#hex","timestamp":"0:00"}], "keyPoints": ["..."], "chapters": [{"title":"...","startTime":"0:00","content":"..."}] }`;

    const result = await callGeminiJSON(prompt);
    const saved = await VideoSummary.create({
      studentId: req.user.userId, videoUrl, videoId: transcript.videoId,
      title: result.title, transcript: transcript.fullText,
      summary: result.summary, summaryCards: result.summaryCards || [],
      keyPoints: result.keyPoints || [], chapters: result.chapters || []
    });
    res.json(saved);
  } catch (error) {
    res.status(500).json({ error: error.message, code: 500 });
  }
});

router.get('/my-summaries', async (req, res) => {
  try {
    const summaries = await VideoSummary.find({ studentId: req.user.userId }).sort({ createdAt: -1 });
    res.json({ summaries });
  } catch (error) {
    res.status(500).json({ error: error.message, code: 500 });
  }
});

router.get('/:summaryId', async (req, res) => {
  try {
    const summary = await VideoSummary.findById(req.params.summaryId);
    if (!summary) return res.status(404).json({ error: 'Summary not found' });
    res.json(summary);
  } catch (error) {
    res.status(500).json({ error: error.message, code: 500 });
  }
});

export default router;
