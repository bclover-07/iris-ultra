import { Router } from 'express';
import { verifyAccessToken } from '../middleware/auth.middleware.js';
import Overcome from '../models/Overcome.js';
import Intervention from '../models/Intervention.js';
import User from '../models/User.js';
import { callGeminiJSON } from '../services/gemini.service.js';
import multer from 'multer';
import { sendStudyPlanEmail } from '../services/email.service.js';

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });
const router = Router();
router.use(verifyAccessToken);


router.get('/', async (req, res) => {
  try {
    const overcome = await Overcome.findOne({ studentId: req.user.userId, isActive: true }).sort({ createdAt: -1 });
    

    const interventions = await Intervention.find({ studentId: req.user.userId }).sort({ createdAt: -1 });

    res.json({ overcome, interventions });
  } catch (error) {
    res.status(500).json({ error: error.message, code: 500 });
  }
});


router.post('/generate', async (req, res) => {
  try {
    const interventions = await Intervention.find({ studentId: req.user.userId });
    const interventionSummary = interventions.map(i => `${i.createdAt.toISOString().split('T')[0]}: [${i.urgency}] ${i.message} (Outcome: ${i.outcome})`).join('\n');

    const prompt = `You are an AI learning architect using Hugging Face & LangGraph methodologies.
A student has the following past interventions and weaknesses:
${interventionSummary || 'No major interventions recorded. Assume general academic disengagement and need for foundational strengthening.'}

Create a structured 7-day "Overcome Learning Path" to help them map past failures to future improvements.
Return ONLY JSON with this structure:
{
  "pastSummary": "Summary of what went wrong...",
  "futureProjection": "How they will improve...",
  "chartData": [
    { "name": "Past", "score": 30 },
    { "name": "Current", "score": 50 },
    { "name": "Future Target", "score": 90 }
  ],
  "flowData": {
    "nodes": [
      { "id": "1", "position": { "x": 0, "y": 0 }, "data": { "label": "Acknowledge Weakness" } },
      { "id": "2", "position": { "x": 0, "y": 100 }, "data": { "label": "Build Foundations" } },
      { "id": "3", "position": { "x": 0, "y": 200 }, "data": { "label": "Mastery" } }
    ],
    "edges": [
      { "id": "e1-2", "source": "1", "target": "2" },
      { "id": "e2-3", "source": "2", "target": "3" }
    ]
  },
  "tasks": [
    {
      "day": 1,
      "title": "Topic Quiz",
      "description": "Play the foundational quiz to assess current level.",
      "type": "internal"
    },
    {
      "day": 2,
      "title": "Notebook Practice",
      "description": "Write down 5 key concepts in your notebook and upload a photo.",
      "type": "external"
    }

  ]
}`;

    const result = await callGeminiJSON(prompt);


    await Overcome.updateMany({ studentId: req.user.userId }, { isActive: false });

    const newOvercome = await Overcome.create({
      studentId: req.user.userId,
      pastSummary: result.pastSummary || 'Analyzing past data...',
      futureProjection: result.futureProjection || 'Charting future path...',
      chartData: result.chartData || [],
      flowData: result.flowData || { nodes: [], edges: [] },
      tasks: result.tasks || []
    });

    try {
      const user = await User.findById(req.user.userId);
      if (user && user.email) {

        await sendStudyPlanEmail(user.email, user.name, {
          title: "Your Overcome Learning Path",
          totalDays: result.tasks.length,
          dailySessions: result.tasks.map(t => ({
             day: t.day,
             topics: [t.title],
             activities: [t.description],
             resources: [t.type]
          }))
        }, true);
      }
    } catch (e) {
      console.error('Failed to send overcome email:', e.message);
    }

    res.status(201).json(newOvercome);
  } catch (error) {
    res.status(500).json({ error: error.message, code: 500 });
  }
});


router.post('/task/:taskId/proof', upload.single('file'), async (req, res) => {
  try {
    const { taskId } = req.params;
    const overcome = await Overcome.findOne({ studentId: req.user.userId, 'tasks._id': taskId });
    
    if (!overcome) return res.status(404).json({ error: 'Task not found' });

    const task = overcome.tasks.id(taskId);
    if (!task) return res.status(404).json({ error: 'Task not found' });

    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });


    const base64Data = req.file.buffer.toString('base64');
    const dataUri = `data:${req.file.mimetype};base64,${base64Data}`;
    
    task.proofUrl = dataUri;
    task.status = 'completed';
    task.submittedAt = new Date();

    await overcome.save();
    res.json({ message: 'Proof submitted successfully', task });
  } catch (error) {
    console.error('Proof upload error:', error);
    res.status(500).json({ error: error.message, code: 500 });
  }
});


router.post('/task/:taskId/verify-internal', async (req, res) => {
  try {
    const { taskId } = req.params;
    const overcome = await Overcome.findOne({ studentId: req.user.userId, 'tasks._id': taskId });
    
    if (!overcome) return res.status(404).json({ error: 'Task not found' });

    const task = overcome.tasks.id(taskId);
    if (!task) return res.status(404).json({ error: 'Task not found' });

    task.status = 'completed';
    task.submittedAt = new Date();

    await overcome.save();
    res.json({ message: 'Task marked as done internally', task });
  } catch (error) {
    res.status(500).json({ error: error.message, code: 500 });
  }
});

export default router;
