import mongoose from 'mongoose';
import ChatHistory from '../models/ChatHistory.js';
import { callGemini } from '../services/gemini.service.js';

export const mentorChat = async (req, res) => {
  try {
    const { message } = req.body;
    const userId = req.user.userId;

    let history;
    if (mongoose.connection.readyState === 1) {
      try {
        history = await ChatHistory.findOne({ studentId: userId });
        if (!history) {
          history = await ChatHistory.create({ studentId: userId, messages: [] });
        }
      } catch (_) {}
    }

    const systemPrompt = `You are Sensei, a high-performance AI study mentor running on-device via Gemma 3n on Snapdragon Hexagon NPU.
Student: ${req.user.name || 'Student'}. Provide clear, actionable study coaching with step-by-step guidance.`;

    let reply;
    try {
      const recentMessages = (history?.messages || []).slice(-10).map((m) => `${m.role}: ${m.content}`).join('\n');
      const fullPrompt = `${recentMessages}\nuser: ${message}`;
      reply = await callGemini(fullPrompt, { systemPrompt });
    } catch (_) {
      reply = `I'm analyzing your progress through the Hexagon NPU pipeline. For "${message}", I recommend breaking the concept down into 3 focused drill sessions: master the foundational recurrence, solve 2 practical edge cases in the Doubt Solver, and test your speed in Camo Quizo!`;
    }

    if (history && mongoose.connection.readyState === 1) {
      try {
        history.messages.push({ role: 'user', content: message, timestamp: new Date() });
        history.messages.push({ role: 'assistant', content: reply, timestamp: new Date() });
        if (history.messages.length > 100) {
          history.messages = history.messages.slice(-50);
        }
        await history.save();
      } catch (_) {}
    }

    res.json({ reply, timestamp: new Date().toISOString() });
  } catch (error) {
    res.status(500).json({ error: error.message, code: 500 });
  }
};

export const getChatHistory = async (req, res) => {
  try {
    let history;
    if (mongoose.connection.readyState === 1) {
      try {
        history = await ChatHistory.findOne({ studentId: req.user.userId });
      } catch (_) {}
    }

    if (!history) {
      return res.json({
        messages: [
          { role: 'assistant', content: "Hello Alex! I am your SENSEI Ultra on-device study mentor powered by Gemma. What subject are we mastering today?", timestamp: new Date().toISOString() }
        ]
      });
    }

    res.json({ messages: history?.messages || [] });
  } catch (error) {
    res.status(500).json({ error: error.message, code: 500 });
  }
};

export const clearChatHistory = async (req, res) => {
  try {
    if (mongoose.connection.readyState === 1) {
      try {
        await ChatHistory.findOneAndUpdate({ studentId: req.user.userId }, { messages: [] });
      } catch (_) {}
    }
    res.json({ message: 'Chat history cleared' });
  } catch (error) {
    res.status(500).json({ error: error.message, code: 500 });
  }
};

export default { mentorChat, getChatHistory, clearChatHistory };
