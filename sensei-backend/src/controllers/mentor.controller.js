import ChatHistory from '../models/ChatHistory.js';
import { callGemini } from '../services/gemini.service.js';

export const mentorChat = async (req, res) => {
  try {
    const { message } = req.body;
    const userId = req.user.userId;

    let history = await ChatHistory.findOne({ studentId: userId });
    if (!history) {
      history = await ChatHistory.create({ studentId: userId, messages: [] });
    }

    const systemPrompt = `You are Sensei, a friendly AI study mentor running on-device via Gemma.
Student: ${req.user.name || 'Student'}. Be encouraging, give specific academic advice, use markdown.`;

    const recentMessages = history.messages.slice(-10).map((m) => `${m.role}: ${m.content}`).join('\n');
    const fullPrompt = `${recentMessages}\nuser: ${message}`;

    const reply = await callGemini(fullPrompt, { systemPrompt });

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
};

export const getChatHistory = async (req, res) => {
  try {
    const history = await ChatHistory.findOne({ studentId: req.user.userId });
    res.json({ messages: history?.messages || [] });
  } catch (error) {
    res.status(500).json({ error: error.message, code: 500 });
  }
};

export const clearChatHistory = async (req, res) => {
  try {
    await ChatHistory.findOneAndUpdate({ studentId: req.user.userId }, { messages: [] });
    res.json({ message: 'Chat history cleared' });
  } catch (error) {
    res.status(500).json({ error: error.message, code: 500 });
  }
};

export default { mentorChat, getChatHistory, clearChatHistory };
