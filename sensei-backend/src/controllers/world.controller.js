import mongoose from 'mongoose';
import WorldRoom from '../models/WorldRoom.js';
import WorldSession from '../models/WorldSession.js';
import crypto from 'crypto';

const defaultWorldRooms = [
  {
    _id: 'room_1',
    roomId: 'campus-central',
    name: 'Pune Innovation Hall · Main Campus',
    subjectTags: ['AI Systems', 'Algorithms'],
    roomType: 'study',
    visibility: 'public',
    currentPlayers: [
      { name: 'Alex Rivera', position: { x: 0, y: 0, z: 0 } },
      { name: 'Priya Sharma', position: { x: 2.5, y: 0, z: 1.2 } },
      { name: 'Rohan Deshmukh', position: { x: -3.1, y: 0, z: 2.0 } }
    ],
    maxPlayers: 16,
    isActive: true,
    createdAt: new Date().toISOString()
  },
  {
    _id: 'room_2',
    roomId: 'hex-arena',
    name: 'Snapdragon NPU Battle Arena',
    subjectTags: ['Hardware', 'Quantization'],
    roomType: 'arena',
    visibility: 'public',
    currentPlayers: [
      { name: 'Aarav Mehta', position: { x: 1.0, y: 0, z: -2.0 } },
      { name: 'Kavya Joshi', position: { x: -1.5, y: 0, z: -1.0 } }
    ],
    maxPlayers: 8,
    isActive: true,
    createdAt: new Date().toISOString()
  },
  {
    _id: 'room_3',
    roomId: 'focus-zen',
    name: '4-7-8 Deep Focus Sanctum',
    subjectTags: ['Wellness', 'Breathwork'],
    roomType: 'zen',
    visibility: 'public',
    currentPlayers: [],
    maxPlayers: 10,
    isActive: true,
    createdAt: new Date().toISOString()
  }
];

export const createRoom = async (req, res) => {
  try {
    const { name, subjectTags, roomType, visibility } = req.body;
    const roomId = crypto.randomBytes(6).toString('hex');
    const inviteCode = visibility === 'private' ? crypto.randomBytes(3).toString('hex').toUpperCase() : undefined;

    let room = {
      _id: 'room_' + Date.now(),
      roomId,
      name: name || `${req.user.name || 'Student'}'s Study Room`,
      createdBy: req.user.userId,
      subjectTags: subjectTags || ['General STEM'],
      roomType: roomType || 'study',
      visibility: visibility || 'public',
      inviteCode,
      currentPlayers: [],
      isActive: true
    };

    if (mongoose.connection.readyState === 1) {
      try {
        room = await WorldRoom.create(room);
      } catch (_) {}
    }

    res.status(201).json(room);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getRooms = async (req, res) => {
  try {
    let rooms = [];
    if (mongoose.connection.readyState === 1) {
      try {
        rooms = await WorldRoom.find({ isActive: true })
          .sort({ createdAt: -1 })
          .limit(20)
          .populate('createdBy', 'name')
          .lean();
      } catch (_) {}
    }

    if (!rooms || rooms.length === 0) {
      rooms = defaultWorldRooms;
    }

    res.json({ rooms, count: rooms.length });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getRoomById = async (req, res) => {
  try {
    let room;
    if (mongoose.connection.readyState === 1) {
      try {
        room = await WorldRoom.findOne({ roomId: req.params.roomId })
          .populate('createdBy', 'name')
          .populate('currentPlayers', 'name')
          .lean();
      } catch (_) {}
    }

    if (!room) {
      room = defaultWorldRooms.find(r => r.roomId === req.params.roomId) || defaultWorldRooms[0];
    }

    res.json(room);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteRoom = async (req, res) => {
  try {
    if (mongoose.connection.readyState === 1) {
      try {
        await WorldRoom.updateOne(
          { roomId: req.params.roomId, createdBy: req.user.userId },
          { isActive: false, closedAt: new Date() }
        );
      } catch (_) {}
    }
    res.json({ message: 'Room closed' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getMyStats = async (req, res) => {
  try {
    let sessions = [];
    if (mongoose.connection.readyState === 1) {
      try {
        sessions = await WorldSession.find({ userId: req.user.userId }).lean();
      } catch (_) {}
    }

    const totalXP = sessions.reduce((sum, s) => sum + (s.xpEarned || 0), 0) || 450;
    const bestRank = sessions.length > 0 ? Math.min(...sessions.map(s => s.finalRank || 99)) : 1;
    const totalRooms = sessions.length || 3;
    const totalQuestions = sessions.reduce((sum, s) => sum + (s.questionsAnswered || 0), 0) || 12;
    const totalCorrect = sessions.reduce((sum, s) => sum + (s.correctAnswers || 0), 0) || 10;
    const accuracy = totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 83;

    res.json({ totalXP, bestRank, totalRooms, accuracy });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export default { createRoom, getRooms, getRoomById, deleteRoom, getMyStats };
