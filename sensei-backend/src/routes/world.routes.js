import { Router } from 'express';
import { verifyAccessToken } from '../middleware/auth.middleware.js';
import WorldRoom from '../models/WorldRoom.js';
import WorldSession from '../models/WorldSession.js';
import crypto from 'crypto';

const router = Router();
router.use(verifyAccessToken);

router.post('/rooms', async (req, res) => {
  try {
    const { name, subjectTags, roomType, visibility } = req.body;
    const roomId = crypto.randomBytes(6).toString('hex');
    const inviteCode = visibility === 'private' ? crypto.randomBytes(3).toString('hex').toUpperCase() : undefined;

    console.log(`[WorldRoutes] Creating room: ${name} by ${req.user.userId}`);
    const room = await WorldRoom.create({
      roomId,
      name: name || `${req.user.name}'s Room`,
      createdBy: req.user.userId,
      subjectTags: subjectTags || ['General'],
      roomType: roomType || 'study',
      visibility: visibility || 'public',
      inviteCode,
      currentPlayers: [],
      isActive: true,
    });

    console.log(`[WorldRoutes] Room created: ${room.roomId}`);
    res.status(201).json(room);
  } catch (error) {
    console.error(`[WorldRoutes] Room creation failed:`, error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/rooms', async (req, res) => {
  try {
    const rooms = await WorldRoom.find({ isActive: true })
      .sort({ createdAt: -1 })
      .limit(20)
      .populate('createdBy', 'name')
      .lean();
    res.json(rooms);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/rooms/:roomId', async (req, res) => {
  try {
    const room = await WorldRoom.findOne({ roomId: req.params.roomId })
      .populate('createdBy', 'name')
      .populate('currentPlayers', 'name')
      .lean();
    if (!room) return res.status(404).json({ error: 'Room not found' });
    res.json(room);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/rooms/:roomId', async (req, res) => {
  try {
    await WorldRoom.updateOne(
      { roomId: req.params.roomId, createdBy: req.user.userId },
      { isActive: false, closedAt: new Date() }
    );
    res.json({ message: 'Room closed' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/sessions/my-stats', async (req, res) => {
  try {
    const sessions = await WorldSession.find({ userId: req.user.userId }).lean();
    const totalXP = sessions.reduce((sum, s) => sum + (s.xpEarned || 0), 0);
    const bestRank = sessions.length > 0 ? Math.min(...sessions.map(s => s.finalRank || 99)) : null;
    const totalRooms = sessions.length;
    const totalQuestions = sessions.reduce((sum, s) => sum + (s.questionsAnswered || 0), 0);
    const totalCorrect = sessions.reduce((sum, s) => sum + (s.correctAnswers || 0), 0);
    const accuracy = totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0;

    res.json({ totalXP, bestRank, totalRooms, accuracy });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
