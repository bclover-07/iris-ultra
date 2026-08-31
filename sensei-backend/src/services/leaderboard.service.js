import Leaderboard from '../models/Leaderboard.js';
import Insight from '../models/Insight.js';
import Student from '../models/Student.js';
import User from '../models/User.js';
import { calculateLeaderboardScore } from '../utils/badgeEngine.js';
import getIO from '../config/socket.js';
import NodeCache from 'node-cache';

const cache = new NodeCache({ stdTTL: 30 });

export const recalculateLeaderboard = async (classId) => {
  const students = await Student.find({ classId });
  
  const entries = [];
  for (const student of students) {
    const user = await User.findById(student.userId);
    if (!user) continue;

    entries.push({
      studentId: student.userId,
      name: user.name,
      score: student.xp || 0,
      xp: student.xp || 0,
      badges: student.badges || [],
      rank: 0,
      change: 0
    });
  }

  entries.sort((a, b) => b.xp - a.xp);
  
  const existing = await Leaderboard.findOne({ classId });
  const previousRanks = {};
  if (existing) {
    for (const entry of existing.entries) {
      previousRanks[entry.studentId.toString()] = entry.rank;
    }
  }

  entries.forEach((entry, index) => {
    entry.rank = index + 1;
    const prevRank = previousRanks[entry.studentId.toString()];
    entry.change = prevRank ? prevRank - entry.rank : 0;
  });

  const leaderboard = await Leaderboard.findOneAndUpdate(
    { classId },
    { classId, entries, updatedAt: new Date() },
    { upsert: true, new: true }
  );

  cache.del(`leaderboard:${classId}`);

  try {
    const io = getIO();
    io.of('/student').to(`class:${classId}`).emit('leaderboard:update', { entries, classId });
  } catch (e) {}

  return leaderboard;
};

export const getClassLeaderboard = async (classId) => {
  const cacheKey = `leaderboard:${classId}`;
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  const leaderboard = await Leaderboard.findOne({ classId });
  if (leaderboard) {
    cache.set(cacheKey, leaderboard);
  }
  return leaderboard;
};

export default { recalculateLeaderboard, getClassLeaderboard };
