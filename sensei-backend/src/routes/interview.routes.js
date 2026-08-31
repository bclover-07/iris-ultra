import express from 'express';
import multer from 'multer';
import crypto from 'crypto';
import { verifyAccessToken } from '../middleware/auth.middleware.js';
import InterviewSession from '../models/InterviewSession.js';
import InterviewReport from '../models/InterviewReport.js';
import { parseResume } from '../utils/resumeParser.js';
import { generatePDFReport } from '../utils/pdfReportGenerator.js';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

const sttLimiter = new Map();

router.post('/start', verifyAccessToken, (req, res) => {
  try {
    const { jobRole, company, mode, difficulty } = req.body;
    if (!jobRole || !company) {
      return res.status(400).json({ error: 'jobRole and company are required' });
    }
    const sessionId = `iv_${crypto.randomUUID()}`;
    res.json({ sessionId, userId: req.user.userId });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create session' });
  }
});

router.post('/stt', verifyAccessToken, upload.single('audio'), async (req, res) => {
  try {
    const userId = req.user.userId.toString();
    const now = Date.now();
    const lastReq = sttLimiter.get(userId);
    if (lastReq && now - lastReq < 3000) {
      return res.status(429).json({ error: 'Too many requests, wait a moment' });
    }
    sttLimiter.set(userId, now);

    const transcript = req.body.transcript || '';
    const duration = parseFloat(req.body.duration) || 0;
    res.json({ transcript, words: [], duration });
  } catch (err) {
    res.status(500).json({ error: 'STT processing failed' });
  }
});

router.post('/resume', verifyAccessToken, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    const parsed = await parseResume(req.file.buffer, req.file.mimetype);
    res.json(parsed);
  } catch (err) {
    console.error('Resume parse error:', err.message);
    res.status(500).json({ error: 'Failed to parse resume' });
  }
});

router.get('/sessions/me', verifyAccessToken, async (req, res) => {
  try {
    const sessions = await InterviewSession.find({ userId: req.user.userId })
      .sort({ startedAt: -1 })
      .limit(10)
      .lean();
    res.json(sessions);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch sessions' });
  }
});

router.get('/reports/:reportId', verifyAccessToken, async (req, res) => {
  try {
    const report = await InterviewReport.findById(req.params.reportId).lean();
    if (!report) return res.status(404).json({ error: 'Report not found' });
    if (report.userId.toString() !== req.user.userId.toString()) {
      return res.status(403).json({ error: 'Access denied' });
    }
    res.json(report);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch report' });
  }
});

router.get('/reports/:reportId/pdf', verifyAccessToken, async (req, res) => {
  try {
    const report = await InterviewReport.findById(req.params.reportId).lean();
    if (!report) return res.status(404).json({ error: 'Report not found' });
    if (report.userId.toString() !== req.user.userId.toString()) {
      return res.status(403).json({ error: 'Access denied' });
    }
    const pdfBuffer = await generatePDFReport(report);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=interview-report-${report.sessionId}.pdf`);
    res.send(pdfBuffer);
  } catch (err) {
    res.status(500).json({ error: 'Failed to generate PDF' });
  }
});

router.get('/leaderboard', verifyAccessToken, async (req, res) => {
  try {
    const leaderboard = await InterviewSession.aggregate([
      { $match: { status: 'completed' } },
      { $group: {
        _id: '$userId',
        avgScore: { $avg: '$finalScores.overall' },
        sessions: { $sum: 1 },
        bestCompany: { $first: '$company' }
      }},
      { $sort: { avgScore: -1 } },
      { $limit: 10 },
      { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'user' } },
      { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } },
      { $project: {
        userId: '$_id', name: '$user.name',
        avgScore: 1, sessions: 1, bestCompany: 1
      }}
    ]);
    res.json(leaderboard);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch leaderboard' });
  }
});

router.get('/companies', (req, res) => {
  const companies = [
    { name: 'Google', style: 'Algorithmic', difficulty: 5, color: '#4285F4' },
    { name: 'Microsoft', style: 'System Design', difficulty: 4, color: '#00A4EF' },
    { name: 'Amazon', style: 'STAR Method', difficulty: 5, color: '#FF9900' },
    { name: 'Meta', style: 'System Design', difficulty: 5, color: '#1877F2' },
    { name: 'Apple', style: 'Behavioral', difficulty: 4, color: '#555555' },
    { name: 'TCS', style: 'Comprehensive', difficulty: 3, color: '#0072C6' },
    { name: 'Infosys', style: 'Technical', difficulty: 3, color: '#007CC3' },
    { name: 'Wipro', style: 'HR + Technical', difficulty: 3, color: '#44166B' },
    { name: 'Flipkart', style: 'DSA + Design', difficulty: 4, color: '#F8D210' },
    { name: 'Zomato', style: 'Product Sense', difficulty: 4, color: '#E23744' },
    { name: 'CRED', style: 'System Design', difficulty: 4, color: '#2D2D2D' },
    { name: 'Razorpay', style: 'Full Stack', difficulty: 4, color: '#3395FF' },
    { name: 'Deloitte', style: 'Case Study', difficulty: 3, color: '#86BC25' },
    { name: 'Accenture', style: 'Behavioral', difficulty: 3, color: '#A100FF' },
    { name: 'IBM', style: 'Technical', difficulty: 3, color: '#054ADA' },
    { name: 'Startup', style: 'Full Stack', difficulty: 3, color: '#FF6B35' }
  ];
  res.json(companies);
});

router.get('/stats/me', verifyAccessToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const sessions = await InterviewSession.find({ userId, status: 'completed' }).sort({ startedAt: -1 }).lean();
    const totalSessions = sessions.length;
    const avgScores = { technical: 0, communication: 0, confidence: 0, eyeContact: 0, posture: 0, fluency: 0, overall: 0 };
    if (totalSessions > 0) {
      sessions.forEach(s => {
        if (s.finalScores) {
          Object.keys(avgScores).forEach(k => { avgScores[k] += (s.finalScores[k] || 0); });
        }
      });
      Object.keys(avgScores).forEach(k => { avgScores[k] = avgScores[k] / totalSessions; });
    }
    const totalXP = sessions.reduce((s, sess) => s + (sess.xpEarned || 0), 0);
    const improvementTrend = sessions.slice(0, 10).reverse().map(s => ({
      date: s.startedAt, score: s.finalScores?.overall || 0, company: s.company
    }));
    const companyCounts = {};
    sessions.forEach(s => { companyCounts[s.company] = (companyCounts[s.company] || 0) + 1; });
    const bestCompany = Object.entries(companyCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'None';

    res.json({ totalSessions, avgScores, improvementTrend, bestCompany, totalXPFromInterviews: totalXP });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

export default router;
