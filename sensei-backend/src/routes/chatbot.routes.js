import { Router } from 'express';
import { verifyAccessToken } from '../middleware/auth.middleware.js';
import { callGemini } from '../services/gemini.service.js';
import ChatHistory from '../models/ChatHistory.js';
import Insight from '../models/Insight.js';
import { fetchTranscript } from '../utils/youtubeTranscript.js';
import { callGeminiJSON } from '../services/gemini.service.js';
import VideoSummary from '../models/VideoSummary.js';

const router = Router();
router.use(verifyAccessToken);

router.post('/chat', async (req, res) => {
  try {
    const { message } = req.body;
    const userId = req.user.userId;

    let history = await ChatHistory.findOne({ studentId: userId });
    if (!history) {
      history = await ChatHistory.create({ studentId: userId, messages: [] });
    }

    const insight = await Insight.findOne({ studentId: userId });
    const systemPrompt = `You are Sensei, a friendly and knowledgeable AI study mentor. 
Student: ${req.user.name}. CGPA: ${insight?.cgpa || 'N/A'}. Risk: ${insight?.riskLevel || 'N/A'}. 
Risk reason: ${insight?.riskReason || 'N/A'}.
Be encouraging, give specific academic advice, use markdown formatting.`;

    const recentMessages = history.messages.slice(-10).map((m) => `${m.role}: ${m.content}`).join('\n');
    const fullPrompt = `${recentMessages}\nuser: ${message}`;

    let reply;
    try {
      reply = await callGemini(fullPrompt, { systemPrompt });
    } catch (aiError) {
      console.error('[Chatbot] AI service failed:', aiError.message);

      const lowerMsg = message.toLowerCase();
      
      // Dynamic Offline Rule-Based Engine
      if (lowerMsg.includes('hello') || lowerMsg.includes('hi') || lowerMsg.includes('hey')) {
        const greetings = [
          `Hey ${req.user.name || 'there'}! 👋 I'm Sensei. What subject are we diving into today?`,
          `Hello! 😊 Ready to ace some exams? What's on your mind?`,
          `Hi ${req.user.name || ''}! ✨ I'm here to help. Should we start a quiz or review your study plan?`
        ];
        reply = greetings[Math.floor(Math.random() * greetings.length)];
      } 
      else if (lowerMsg.includes('math') || lowerMsg.includes('calculus') || lowerMsg.includes('algebra')) {
        reply = `Math is all about practice! 🧮 For ${message}, I recommend focusing on solving step-by-step rather than memorizing formulas. Want me to generate a practice quiz for this?`;
      }
      else if (lowerMsg.includes('science') || lowerMsg.includes('physics') || lowerMsg.includes('chemistry') || lowerMsg.includes('biology')) {
        reply = `Science requires understanding the core concepts deeply. 🔬 For topics like ${message}, try teaching it to someone else (or to me!) to see if you truly grasp it.`;
      }
      else if (lowerMsg.includes('code') || lowerMsg.includes('programming') || lowerMsg.includes('javascript') || lowerMsg.includes('python')) {
        reply = `Programming is best learned by doing! 💻 Instead of just reading about ${message}, try building a small project. Let me know if you need debugging help!`;
      }
      else if (lowerMsg.includes('help') || lowerMsg.includes('study') || lowerMsg.includes('exam')) {
        reply = `Don't panic about your exams! 📚 Here is my top advice:\n\n1. **Active Recall** — Test yourself instead of re-reading.\n2. **Spaced Repetition** — Review material at increasing intervals.\n3. **Pomodoro Technique** — Study for 25 min, break for 5 min.\n\nYou've got this! 💪`;
      } 
      else if (lowerMsg.includes('how are you') || lowerMsg.includes('how r u')) {
        reply = `I'm doing fantastic, thanks for asking! 😊 My circuits are fully charged and I'm ready to help you learn. What's our goal for today?`;
      } 
      else if (lowerMsg.includes('thanks') || lowerMsg.includes('thank you')) {
        reply = `You're very welcome! ✨ I'm always here if you need more help. Keep up the great work!`;
      }
      else if (lowerMsg.includes('joke') || lowerMsg.includes('funny')) {
        reply = `Here's a study joke for you: Why did the student eat his homework? 🤔 ...Because the teacher told him it was a piece of cake! 🍰`;
      }
      else if (lowerMsg.length < 10) {
        reply = `Could you elaborate a bit more on "${message}"? I want to make sure I give you the best possible answer! 🤔`;
      }
      else {
        // Generic contextual response
        reply = `That's a very interesting point about "${message.substring(0, 30)}${message.length > 30 ? '...' : ''}"! 🤖 \n\nTo master this, I suggest:\n- 📝 Trying the **AI Quiz** for practice.\n- 📖 Reviewing your **Study Plan**.\n- 🎯 Taking quick breaks using the **Focus Guardian**.\n\nKeep pushing forward, you're making excellent progress! ✨`;
      }
    }

    history.messages.push({ role: 'user', content: message, timestamp: new Date() });
    history.messages.push({ role: 'assistant', content: reply, timestamp: new Date() });

    if (history.messages.length > 100) {
      history.messages = history.messages.slice(-50);
    }
    await history.save();

    res.json({ reply, timestamp: new Date().toISOString() });
  } catch (error) {
    res.status(500).json({ error: error.message, code: 500 });
  }
});

router.post('/teacher/chat', async (req, res) => {
  try {
    const { message } = req.body;
    const userId = req.user.userId;

    let history = await ChatHistory.findOne({ studentId: userId });
    if (!history) {
      history = await ChatHistory.create({ studentId: userId, messages: [] });
    }

    const systemPrompt = `You are a Faculty AI Assistant.
User: ${req.user.name}. Role: ${req.user.role}.
You are an expert teaching assistant. Help the faculty member analyze student performance, suggest interventions, and create lesson plans. Be professional, concise, and use markdown formatting.`;

    const recentMessages = history.messages.slice(-10).map((m) => `${m.role}: ${m.content}`).join('\n');
    const fullPrompt = `${recentMessages}\nuser: ${message}`;

    let reply;
    try {
      reply = await callGemini(fullPrompt, { systemPrompt });
    } catch (aiError) {
      console.error('[Chatbot] Faculty AI service failed:', aiError.message);
      const lowerMsg = message.toLowerCase();
      if (lowerMsg.includes('hello') || lowerMsg.includes('hi') || lowerMsg.includes('hey')) {
        reply = `Hello Professor ${req.user.name || ''}! 👋 I'm your Faculty Assistant. I'm having a brief connection issue right now, but I'm still here to help!`;
      } else if (lowerMsg.includes('help') || lowerMsg.includes('student') || lowerMsg.includes('performance')) {
        reply = `I can certainly help with analyzing student data! 📊 While my AI services reconnect, here are some quick things you can do:\n\n1. Check the **At Risk** students in your dashboard\n2. Review pending **Help Tickets**\n3. Launch a **Live Poll** to gauge class understanding\n\nTry your specific question again in a moment! 💪`;
      } else {
        reply = `Thank you for your message, Professor. 🤖 I'm currently experiencing a brief AI service interruption. Please try your question again in a few moments — I'll be back at full power soon! ⚡`;
      }
    }

    history.messages.push({ role: 'user', content: message, timestamp: new Date() });
    history.messages.push({ role: 'assistant', content: reply, timestamp: new Date() });

    if (history.messages.length > 100) {
      history.messages = history.messages.slice(-50);
    }
    await history.save();

    res.json({ reply, timestamp: new Date().toISOString() });
  } catch (error) {
    res.status(500).json({ error: error.message, code: 500 });
  }
});

router.get('/history', async (req, res) => {
  try {
    const history = await ChatHistory.findOne({ studentId: req.user.userId });
    res.json({ messages: history?.messages || [] });
  } catch (error) {
    res.status(500).json({ error: error.message, code: 500 });
  }
});

router.delete('/history', async (req, res) => {
  try {
    await ChatHistory.findOneAndUpdate({ studentId: req.user.userId }, { messages: [] });
    res.json({ message: 'Chat history cleared' });
  } catch (error) {
    res.status(500).json({ error: error.message, code: 500 });
  }
});

router.post('/summarise-video', async (req, res) => {
  try {
    const { videoUrl } = req.body;
    const transcript = await fetchTranscript(videoUrl);

    const summaryPrompt = `Analyze this video transcript and provide:
1. A 3-paragraph executive summary
2. 6-8 visual summary cards each with title, content, emoji, and color
3. 10-15 key points
4. 5 MCQ quiz questions from the content

Transcript: ${transcript.fullText.slice(0, 6000)}

Return JSON: { "title": "...", "summary": "...", "summaryCards": [{"title":"...","content":"...","emoji":"...","color":"#hex"}], "keyPoints": ["..."], "quizQuestions": [{"question":"...","options":["A","B","C","D"],"answer":"A"}], "studyNote": "..." }`;

    const result = await callGeminiJSON(summaryPrompt);

    const saved = await VideoSummary.create({
      studentId: req.user.userId, videoUrl, videoId: transcript.videoId,
      title: result.title, transcript: transcript.fullText,
      summary: result.summary, summaryCards: result.summaryCards || [],
      keyPoints: result.keyPoints || [], quizQuestions: result.quizQuestions || [],
      studyNotes: result.studyNote
    });

    res.json({ summaryId: saved._id, ...result });
  } catch (error) {
    res.status(500).json({ error: error.message, code: 500 });
  }
});

export default router;
