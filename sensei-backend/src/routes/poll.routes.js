import { Router } from 'express';
import { verifyAccessToken } from '../middleware/auth.middleware.js';
import Poll from '../models/Poll.js';
import Class from '../models/Class.js';
import getIO from '../config/socket.js';

const router = Router();
router.use(verifyAccessToken);

router.post('/', async (req, res) => {
  try {
    let { classId, question, options, duration } = req.body;
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    

    if (classId && !/^[0-9a-fA-F]{24}$/.test(classId)) {
      return res.status(400).json({ error: 'Invalid Class ID format. Must be a 24 character hex string.' });
    }
    if (!classId) classId = undefined;
    
    let expiresAt = undefined;
    if (duration) {
      expiresAt = new Date(Date.now() + duration * 1000);
    }

    const poll = await Poll.create({
      teacherId: req.user.userId, 
      classId, 
      question,
      options: options && options.length > 0 ? options : ['Strongly Agree', 'Agree', 'Neutral', 'Disagree', 'Strongly Disagree'],
      code,
      duration,
      expiresAt
    });

    if (duration) {

      setTimeout(async () => {
        try {
          const closedPoll = await Poll.findByIdAndUpdate(poll._id, { isOpen: false, closedAt: new Date() }, { new: true });
          if (closedPoll) {
            const io = getIO();
            io.of('/student').emit('poll:closed', { pollId: closedPoll._id });
          }
        } catch (e) {
          console.error('Auto close poll error:', e);
        }
      }, duration * 1000);
    }

    try {
      const io = getIO();
      io.of('/student').emit('poll:new', poll);
    } catch (e) {
      console.error('Socket emit error (poll:new):', e.message);
    }

    res.status(201).json(poll);
  } catch (error) {
    res.status(500).json({ error: error.message, code: 500 });
  }
});

router.get('/student/active', async (req, res) => {
  try {
    const userId = req.user.userId;

    const classes = await Class.find({ 
      $or: [
        { studentIds: userId },
        { department: req.user.department }
      ]
    });
    const classIds = classes.map(c => c._id);


    const polls = await Poll.find({ 
      isOpen: true,
      $and: [
        {
          $or: [
            { classId: { $in: classIds } },
            { classId: { $exists: false } },
            { classId: null }
          ]
        },
        {
          $or: [
            { expiresAt: { $exists: false } },
            { expiresAt: { $gt: new Date() } }
          ]
        }
      ]
    }).sort({ createdAt: -1 });

    const resultPolls = polls.map(poll => {
      const p = poll.toObject();
      const counts = {};
      for (const opt of p.options) counts[opt] = 0;
      for (const resp of p.responses) {
        if (counts[resp.option] !== undefined) counts[resp.option]++;
      }
      const total = p.responses.length;
      p.results = Object.entries(counts).map(([option, count]) => ({
        option, count, percentage: total > 0 ? Math.round((count / total) * 100) : 0
      }));
      return p;
    });

    res.json(resultPolls);
  } catch (error) {
    res.status(500).json({ error: error.message, code: 500 });
  }
});

router.get('/student/archived', async (req, res) => {
  try {
    const userId = req.user.userId;
    const classes = await Class.find({ 
      $or: [{ studentIds: userId }, { department: req.user.department }]
    });
    const classIds = classes.map(c => c._id);

    const polls = await Poll.find({ 
      $and: [
        {
          $or: [
            { classId: { $in: classIds } },
            { classId: { $exists: false } },
            { classId: null }
          ]
        },
        {
          $or: [
            { isOpen: false },
            { expiresAt: { $lt: new Date() } }
          ]
        }
      ]
    }).sort({ closedAt: -1, expiresAt: -1 }).limit(10);

    const resultPolls = polls.map(poll => {
      const p = poll.toObject();
      const counts = {};
      for (const opt of p.options) counts[opt] = 0;
      for (const resp of p.responses) {
        if (counts[resp.option] !== undefined) counts[resp.option]++;
      }
      const total = p.responses.length;
      p.results = Object.entries(counts).map(([option, count]) => ({
        option, count, percentage: total > 0 ? Math.round((count / total) * 100) : 0
      }));
      return p;
    });

    res.json(resultPolls);
  } catch (error) {
    res.status(500).json({ error: error.message, code: 500 });
  }
});

router.get('/class/:classId', async (req, res) => {
  try {
    const poll = await Poll.findOne({ classId: req.params.classId, isOpen: true }).sort({ createdAt: -1 });
    res.json(poll || null);
  } catch (error) {
    res.status(500).json({ error: error.message, code: 500 });
  }
});

router.post('/:pollId/respond', async (req, res) => {
  try {
    const { option } = req.body;
    const poll = await Poll.findById(req.params.pollId);
    if (!poll || !poll.isOpen) return res.status(400).json({ error: 'Poll not available' });

    const alreadyResponded = poll.responses.find((r) => r.studentId?.toString() === req.user.userId.toString());
    if (alreadyResponded) return res.status(400).json({ error: 'Already responded' });

    poll.responses.push({ studentId: req.user.userId, option });
    await poll.save();

    try {
      const io = getIO();
      

      const counts = {};
      for (const opt of poll.options) counts[opt] = 0;
      for (const resp of poll.responses) {
        if (counts[resp.option] !== undefined) counts[resp.option]++;
      }
      const total = poll.responses.length;
      const results = Object.entries(counts).map(([option, count]) => ({
        option, count, percentage: total > 0 ? Math.round((count / total) * 100) : 0
      }));


      io.of('/teacher').to(poll.teacherId.toString()).emit('poll:update_results', {
        pollId: poll._id, 
        results,
        total
      });


      io.of('/student').to(`class:${poll.classId}`).emit('poll:update_results', {
        pollId: poll._id, 
        results,
        total
      });
    } catch (e) {}

    res.json({ message: 'Response recorded' });
  } catch (error) {
    res.status(500).json({ error: error.message, code: 500 });
  }
});

router.get('/:pollId/results', async (req, res) => {
  try {
    const poll = await Poll.findById(req.params.pollId);
    if (!poll) return res.status(404).json({ error: 'Poll not found' });

    const counts = {};
    for (const opt of poll.options) counts[opt] = 0;
    for (const resp of poll.responses) {
      if (counts[resp.option] !== undefined) counts[resp.option]++;
    }
    const total = poll.responses.length;
    const responses = Object.entries(counts).map(([option, count]) => ({
      option, count, percentage: total > 0 ? Math.round((count / total) * 100) : 0
    }));

    res.json({ question: poll.question, responses, liveCount: total });
  } catch (error) {
    res.status(500).json({ error: error.message, code: 500 });
  }
});

router.patch('/:pollId/close', async (req, res) => {
  try {
    const poll = await Poll.findByIdAndUpdate(req.params.pollId, { isOpen: false, closedAt: new Date() }, { new: true });
    if (poll) {
      try {
        const io = getIO();
        io.of('/student').to(`class:${poll.classId}`).emit('poll:closed', { pollId: poll._id });
        io.of('/teacher').to(poll.teacherId.toString()).emit('poll:closed', { pollId: poll._id });
      } catch (e) {}
    }
    res.json({ message: 'Poll closed' });
  } catch (error) {
    res.status(500).json({ error: error.message, code: 500 });
  }
});

export default router;
