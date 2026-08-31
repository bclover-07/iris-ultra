import HelpTicket from '../models/HelpTicket.js';
import User from '../models/User.js';
import { createNotification } from '../services/notification.service.js';
import getIO from '../config/socket.js';

export const getFaculty = async (req, res) => {
  try {
    const teachers = await User.find({ role: 'student' }, 'name email _id avatar department').limit(5);
    res.json({ teachers });
  } catch (error) {
    res.status(500).json({ error: error.message, code: 500 });
  }
};

export const createTicket = async (req, res) => {
  try {
    const { message, category, urgency } = req.body;
    const ticket = await HelpTicket.create({
      studentId: req.user.userId,
      message,
      category: category || 'Academic',
      urgency: urgency || 'medium',
      status: 'pending'
    });

    try {
      const { callGemini } = await import('../services/gemini.service.js');
      const aiReply = await callGemini(
        `You are Iris Plus AI Mentor. Provide a helpful, clear, and encouraging resolution to this student's help ticket: "${message}"`
      );
      if (aiReply) {
        ticket.response = aiReply;
        ticket.status = 'responded';
        ticket.respondedAt = new Date();
        await ticket.save();
      }
    } catch (aiErr) {
      console.warn('AI auto-response skipped:', aiErr.message);
    }

    const populatedTicket = await HelpTicket.findById(ticket._id)
      .populate('studentId', 'name studentId email avatar');

    try {
      const io = getIO();
      io.of('/student').to(req.user.userId.toString()).emit('help:ticket_updated', populatedTicket);
    } catch (e) {}

    res.status(201).json(populatedTicket);
  } catch (error) {
    res.status(500).json({ error: error.message, code: 500 });
  }
};

export const getTickets = async (req, res) => {
  try {
    const tickets = await HelpTicket.find({ studentId: req.user.userId })
      .populate('studentId', 'name studentId email avatar')
      .sort({ createdAt: -1 });

    res.json({ tickets });
  } catch (error) {
    res.status(500).json({ error: error.message, code: 500 });
  }
};

export const respondToTicket = async (req, res) => {
  try {
    const { response } = req.body;
    const ticket = await HelpTicket.findByIdAndUpdate(
      req.params.id,
      {
        response,
        status: 'responded',
        respondedAt: new Date()
      },
      { new: true }
    ).populate('studentId', 'name studentId email avatar');

    if (!ticket) return res.status(404).json({ error: 'Ticket not found' });
    res.json(ticket);
  } catch (error) {
    res.status(500).json({ error: error.message, code: 500 });
  }
};

export const resolveTicket = async (req, res) => {
  try {
    const ticket = await HelpTicket.findByIdAndUpdate(
      req.params.id,
      {
        status: 'resolved',
        resolvedAt: new Date()
      },
      { new: true }
    ).populate('studentId', 'name studentId email avatar');

    if (!ticket) return res.status(404).json({ error: 'Ticket not found' });
    res.json(ticket);
  } catch (error) {
    res.status(500).json({ error: error.message, code: 500 });
  }
};

export const generateAIDraft = async (req, res) => {
  try {
    const { callGemini } = await import('../services/gemini.service.js');
    const ticket = await HelpTicket.findById(req.params.id).populate('studentId', 'name');
    if (!ticket) return res.status(404).json({ error: 'Ticket not found' });

    const prompt = `You are Iris Plus AI study mentor.
    Student Name: ${ticket.studentId?.name || 'Student'}
    Question: ${ticket.message}
    Write a clear, concise, and helpful solution.`;

    const draft = await callGemini(prompt);
    res.json({ draft });
  } catch (error) {
    res.status(500).json({ error: error.message, code: 500 });
  }
};
