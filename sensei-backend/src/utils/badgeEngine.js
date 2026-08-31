import Student from '../models/Student.js';
import QuizAttempt from '../models/QuizAttempt.js';
import StudyPlan from '../models/StudyPlan.js';
import Note from '../models/Note.js';
import getIO from '../config/socket.js';

const BADGES = {
  FIRST_QUIZ:     { id: 'first_quiz',     name: 'Quiz Rookie',      emoji: '🎯', xp: 50 },
  PERFECT_SCORE:  { id: 'perfect_score',  name: 'Perfectionist',    emoji: '💯', xp: 200 },
  STREAK_7:       { id: 'streak_7',       name: 'Week Warrior',     emoji: '🔥', xp: 150 },
  STREAK_30:      { id: 'streak_30',      name: 'Unstoppable',      emoji: '⚡', xp: 500 },
  STUDY_PLAN_5:   { id: 'study_plan_5',   name: 'Planner Pro',      emoji: '📚', xp: 100 },
  NOTES_10:       { id: 'notes_10',       name: 'Note Ninja',       emoji: '📝', xp: 100 },
  HELP_SEEKER:    { id: 'help_seeker',    name: 'Smart Asker',      emoji: '🙋', xp: 50  },
  CAMO_MASTER:    { id: 'camo_master',    name: 'Gesture Guru',     emoji: '🤚', xp: 300 },
  RISK_RECOVERED: { id: 'risk_recovered', name: 'Comeback King',    emoji: '👑', xp: 400 },
  TOP_3:          { id: 'top_3',          name: 'Podium Finisher',  emoji: '🥉', xp: 250 },
  RANK_1:         { id: 'rank_1',         name: 'Class Champion',   emoji: '🏆', xp: 1000 },
};

export const getLevel = (xp) => Math.floor(xp / 500) + 1;

export const calculateLeaderboardScore = (cgpa, xp, dropoutScore) => {
  return (cgpa || 0) * 300 + (xp || 0) * 0.1 + (100 - (dropoutScore || 0)) * 0.5;
};

export const checkAndAwardBadges = async (studentId, event, data = {}) => {
  const student = await Student.findOne({ userId: studentId });
  if (!student) return [];

  const currentBadges = new Set(student.badges || []);
  const newBadges = [];

  const award = (badge) => {
    if (!currentBadges.has(badge.id)) {
      newBadges.push(badge);
      currentBadges.add(badge.id);
    }
  };

  if (event === 'quiz_complete') {
    const totalAttempts = await QuizAttempt.countDocuments({ studentId });
    if (totalAttempts === 1) award(BADGES.FIRST_QUIZ);
    if (data.percentage === 100) award(BADGES.PERFECT_SCORE);
    if (data.quizMode === 'camo') {
      const camoCount = await QuizAttempt.countDocuments({ studentId, quizMode: 'camo' });
      if (camoCount >= 5) award(BADGES.CAMO_MASTER);
    }
  }

  if (event === 'streak_update') {
    if (student.streakDays >= 7) award(BADGES.STREAK_7);
    if (student.streakDays >= 30) award(BADGES.STREAK_30);
  }

  if (event === 'study_plan_create') {
    const planCount = await StudyPlan.countDocuments({ studentId });
    if (planCount >= 5) award(BADGES.STUDY_PLAN_5);
  }

  if (event === 'note_create') {
    const noteCount = await Note.countDocuments({ studentId });
    if (noteCount >= 10) award(BADGES.NOTES_10);
  }

  if (event === 'help_request') {
    award(BADGES.HELP_SEEKER);
  }

  if (event === 'rank_update') {
    if (data.rank === 1) award(BADGES.RANK_1);
    if (data.rank <= 3) award(BADGES.TOP_3);
  }

  if (event === 'risk_recovery') {
    award(BADGES.RISK_RECOVERED);
  }

  if (newBadges.length > 0) {
    let totalXpEarned = 0;
    for (const badge of newBadges) {
      student.badges.push(badge.id);
      student.xp += badge.xp;
      totalXpEarned += badge.xp;
    }
    student.level = getLevel(student.xp);
    await student.save();

    try {
      const io = getIO();
      for (const badge of newBadges) {
        io.of('/student').to(studentId.toString()).emit('badge:earned', {
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
