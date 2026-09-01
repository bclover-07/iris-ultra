import StudentProfile from '../models/StudentProfile.js';
import QuizAttempt from '../models/QuizAttempt.js';
import StudyPlan from '../models/StudyPlan.js';
import getIO from '../config/socket.js';

const BADGES = {
  FIRST_QUIZ:     { id: 'first_quiz',     name: 'Quiz Rookie',      emoji: '🎯', xp: 50 },
  PERFECT_SCORE:  { id: 'perfect_score',  name: 'Perfectionist',    emoji: '💯', xp: 200 },
  STREAK_7:       { id: 'streak_7',       name: 'Week Warrior',     emoji: '🔥', xp: 150 },
  STREAK_30:      { id: 'streak_30',      name: 'Unstoppable',      emoji: '⚡', xp: 500 },
  STUDY_PLAN_5:   { id: 'study_plan_5',   name: 'Planner Pro',      emoji: '📚', xp: 100 },
  CAMO_MASTER:    { id: 'camo_master',    name: 'Gesture Guru',     emoji: '🤚', xp: 300 },
  TOP_3:          { id: 'top_3',          name: 'Podium Finisher',  emoji: '🥉', xp: 250 },
  RANK_1:         { id: 'rank_1',         name: 'Class Champion',   emoji: '🏆', xp: 1000 },
};

export const getLevel = (xp) => Math.floor(xp / 500) + 1;

export const calculateLeaderboardScore = (mastery, presence, xp) => {
  return (mastery || 80) * 0.4 + (presence || 80) * 0.4 + (xp || 0) * 0.2;
};

export const checkAndAwardBadges = async (userId, event, data = {}) => {
  const profile = await StudentProfile.findOne({ userId });
  if (!profile) return [];

  const newBadges = [];

  if (event === 'quiz_complete') {
    const totalAttempts = await QuizAttempt.countDocuments({ userId });
    if (totalAttempts === 1) newBadges.push(BADGES.FIRST_QUIZ);
    if (data.percentage === 100) newBadges.push(BADGES.PERFECT_SCORE);
  }

  if (event === 'streak_update') {
    if (profile.streak >= 7) newBadges.push(BADGES.STREAK_7);
    if (profile.streak >= 30) newBadges.push(BADGES.STREAK_30);
  }

  if (newBadges.length > 0) {
    let totalXpEarned = 0;
    for (const badge of newBadges) {
      profile.xp += badge.xp;
      totalXpEarned += badge.xp;
    }
    profile.level = getLevel(profile.xp);
    await profile.save();

    try {
      const io = getIO();
      for (const badge of newBadges) {
        io.of('/student').to(userId.toString()).emit('badge:earned', {
          badge: { id: badge.id, name: badge.name, emoji: badge.emoji },
          xpEarned: badge.xp
        });
      }
    } catch (e) {}
  }

  return newBadges;
};

export { BADGES };
export default { BADGES, checkAndAwardBadges, getLevel, calculateLeaderboardScore };
