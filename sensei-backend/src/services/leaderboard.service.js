import Leaderboard from '../models/Leaderboard.js';
import StudentProfile from '../models/StudentProfile.js';
import User from '../models/User.js';
import getIO from '../config/socket.js';
import NodeCache from 'node-cache';

const cache = new NodeCache({ stdTTL: 30 });

export const recalculateLeaderboard = async () => {
  const profiles = await StudentProfile.find().sort({ xp: -1 }).limit(100);
  
  const entries = [];
  for (let i = 0; i < profiles.length; i++) {
    const profile = profiles[i];
    const user = await User.findById(profile.userId);
    if (!user) continue;

    entries.push({
      studentId: profile.userId,
      name: user.name,
      score: profile.xp || 250,
      xp: profile.xp || 250,
      streak: profile.streak || 1,
      rank: i + 1,
      change: 0
    });
  }

  const leaderboard = await Leaderboard.findOneAndUpdate(
    {},
    { entries, updatedAt: new Date() },
    { upsert: true, new: true }
  );

  cache.del('global_leaderboard');

  try {
    const io = getIO();
    io.of('/student').emit('leaderboard:update', { entries });
  } catch (e) {}

  return leaderboard;
};

export const getClassLeaderboard = async () => {
  const cacheKey = 'global_leaderboard';
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  let leaderboard = await Leaderboard.findOne();
  if (!leaderboard) {
    leaderboard = await recalculateLeaderboard();
  }
  
  if (leaderboard) {
    cache.set(cacheKey, leaderboard);
  }
  return leaderboard;
};

export default { recalculateLeaderboard, getClassLeaderboard };
