import { Router } from 'express';
import { verifyAccessToken } from '../middleware/auth.middleware.js';
import Note from '../models/Note.js';
import VideoSummary from '../models/VideoSummary.js';
import { callGeminiJSON } from '../services/gemini.service.js';
import multer from 'multer';
import * as pdfParseModule from 'pdf-parse';
const pdfParse = pdfParseModule.default || pdfParseModule;


const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });
const router = Router();
router.use(verifyAccessToken);

router.get('/', async (req, res) => {
  try {
    const notes = await Note.find({ studentId: req.user.userId }).sort({ createdAt: -1 });
    res.json({ notes });
  } catch (error) {
    res.status(500).json({ error: error.message, code: 500 });
  }
});

router.post('/', async (req, res) => {
  try {
    const { title, content, tags, flowData, folder, attachments, isAiNote, aiSource } = req.body;
    const note = await Note.create({ 
      studentId: req.user.userId, 
      title, 
      content, 
      tags: tags || [], 
      flowData,
      folder: folder || 'General',
      attachments: attachments || [],
      isAiNote: isAiNote || false,
      aiSource: aiSource || 'none'
    });
    res.status(201).json(note);
  } catch (error) {
    res.status(500).json({ error: error.message, code: 500 });
  }
});

router.post('/generate-llm', async (req, res) => {
  try {
    const { prompt } = req.body;
    
    const geminiPrompt = `You are an expert tutor. Create a comprehensive note on the following topic: "${prompt}".
Include a title, markdown content, and a flow diagram representing the concepts using nodes and edges for ReactFlow.
Return ONLY JSON in this format: 
{
  "title": "...",
  "content": "# Markdown content here...",
  "tags": ["tag1", "tag2"],
  "flowData": {
    "nodes": [
      { "id": "1", "position": { "x": 0, "y": 0 }, "data": { "label": "Node 1" } }
    ],
    "edges": [
      { "id": "e1-2", "source": "1", "target": "2" }
    ]
  }
}`;

    const result = await callGeminiJSON(geminiPrompt);
    
    const note = await Note.create({
      studentId: req.user.userId,
      title: result.title || `Notes on ${prompt}`,
      content: result.content || '',
      tags: result.tags || [],
      flowData: result.flowData || null,
      isAiNote: true,
      aiSource: 'text'
    });
    
    res.status(201).json(note);
  } catch (error) {
    res.status(500).json({ error: error.message, code: 500 });
  }
});

router.post('/generate-ai-file', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file provided' });
    
    let text = '';
    if (req.file.mimetype === 'application/pdf') {
      const pdfData = await pdfParse(req.file.buffer);
      text = pdfData.text.slice(0, 15000);
    } else {
      text = req.file.buffer.toString('utf8').slice(0, 15000);
    }

    const geminiPrompt = `You are an expert tutor. Create a comprehensive note based on the following extracted document text.
Document Text:
"""
${text}
"""

Include a concise title, highly structured markdown content summarizing the document, and a flow diagram representing the concepts using nodes and edges for ReactFlow.
Return ONLY JSON in this format: 
{
  "title": "...",
  "content": "# Markdown content here...",
  "tags": ["tag1", "tag2"],
  "flowData": {
    "nodes": [
      { "id": "1", "position": { "x": 0, "y": 0 }, "data": { "label": "Node 1" } }
    ],
    "edges": [
      { "id": "e1-2", "source": "1", "target": "2" }
    ]
  }
}`;

    const result = await callGeminiJSON(geminiPrompt);
    
    const note = await Note.create({
      studentId: req.user.userId,
      title: result.title || `Notes from ${req.file.originalname}`,
      content: result.content || text.slice(0, 500),
      tags: result.tags || [],
      flowData: result.flowData || null,
      isAiNote: true,
      aiSource: 'pdf',
      attachments: [{
        name: req.file.originalname,
        type: req.file.mimetype,
        url: '#'
      }]
    });
    
    res.status(201).json(note);
  } catch (error) {
    console.error('File generation error:', error);
    res.status(500).json({ error: error.message, code: 500 });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const note = await Note.findById(req.params.id);
    if (!note) return res.status(404).json({ error: 'Note not found' });
    res.json(note);
  } catch (error) {
    res.status(500).json({ error: error.message, code: 500 });
  }
});

router.patch('/:id', async (req, res) => {
  try {
    const note = await Note.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(note);
  } catch (error) {
    res.status(500).json({ error: error.message, code: 500 });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await Note.findByIdAndDelete(req.params.id);
    res.json({ message: 'Note deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message, code: 500 });
  }
});

router.post('/:id/generate-chart', async (req, res) => {
  try {
    const note = await Note.findById(req.params.id);
    if (!note) return res.status(404).json({ error: 'Note not found' });

    const prompt = `Analyze this note and extract data for visualization. If the note contains numbers, comparisons, trends, or lists, create a chart.
Note: "${note.content}"
Return JSON: { "chartType": "bar|line|pie|radar|none", "chartTitle": "...", "chartConfig": { "data": [{"name": "...", "value": N}], "xAxis": "...", "yAxis": "...", "colors": ["#hex"] }, "insights": ["..."] }
If no chartable data, return chartType: "none".`;

    const result = await callGeminiJSON(prompt);

    if (result.chartType !== 'none') {
      note.chartData = result;
      note.hasChart = true;
      await note.save();
    }

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message, code: 500 });
  }
});

router.post('/from-video-summary', async (req, res) => {
  try {
    const { summaryId } = req.body;
    const summary = await VideoSummary.findById(summaryId);
    if (!summary) return res.status(404).json({ error: 'Summary not found' });

    const content = `# ${summary.title}\n\n${summary.summary}\n\n## Key Points\n${(summary.keyPoints || []).map((k) => `- ${k}`).join('\n')}`;
    const note = await Note.create({
      studentId: req.user.userId,
      title: summary.title || 'Video Notes',
      content,
      tags: ['video-summary']
    });
    res.status(201).json(note);
  } catch (error) {
    res.status(500).json({ error: error.message, code: 500 });
  }
});

export default router;
