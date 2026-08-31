import { Router } from 'express';
import { verifyAccessToken } from '../middleware/auth.middleware.js';
import { requireRole } from '../middleware/role.middleware.js';
import { callGeminiJSON } from '../services/gemini.service.js';
import Quiz from '../models/Quiz.js';
import QuizAttempt from '../models/QuizAttempt.js';
import Intervention from '../models/Intervention.js';
import { checkAndAwardBadges } from '../utils/badgeEngine.js';

const router = Router();
router.use(verifyAccessToken, requireRole('student'));

router.post('/generate', async (req, res) => {
  try {
    const { mode, topic, interventionId, difficulty } = req.body;
    let context = topic || '';
    if (mode === 'intervention' && interventionId) {
      const intervention = await Intervention.findById(interventionId);
      if (intervention) context = intervention.message;
    }

    const prompt = `Generate 10 MCQ quiz questions on "${context}" at ${difficulty || 'intermediate'} level.
Return a JSON array of objects with: id (q1-q10), question, options (array of 4), correctAnswer (exact match one option), explanation, difficulty, topic.
Make questions progressively harder. Ensure all options are distinct and correctAnswer matches exactly one option.`;

    let questions;
    try {
      questions = await callGeminiJSON(prompt);
    } catch (aiError) {
      console.warn('[Quiz] AI failed, using fallback quiz:', aiError.message);
      questions = {
        questions: Array.from({ length: 10 }).map((_, i) => ({
          id: `q${i + 1}`,
          question: `Fallback Question ${i + 1}: What is the most important concept in ${context || 'this topic'}?`,
          options: [`Option A for ${context}`, `Option B for ${context}`, `Option C for ${context}`, `Option D for ${context}`],
          correctAnswer: `Option A for ${context}`,
          explanation: `This is a fallback explanation because the AI service is currently overloaded.`,
          difficulty: difficulty || 'intermediate',
          topic: context || 'General'
        }))
      };
    }
    
    const questionsArr = Array.isArray(questions) ? questions : questions.questions || [];

    const quiz = await Quiz.create({
      studentId: req.user.userId, mode, topic: context,
      interventionId: mode === 'intervention' ? interventionId : undefined,
      difficulty: difficulty || 'intermediate', generatedBy: 'student_request',
      questions: questionsArr, totalQuestions: questionsArr.length
    });

    const safeQuestions = questionsArr.map((q) => ({
      id: q.id, question: q.question, options: q.options, difficulty: q.difficulty, topic: q.topic
    }));

    res.json({ quizId: quiz._id, questions: safeQuestions });
  } catch (error) {
    res.status(500).json({ error: error.message, code: 500 });
  }
});

router.post('/submit', async (req, res) => {
  try {
    const { quizId, answers, timeTaken } = req.body;
    const quiz = await Quiz.findById(quizId);
    if (!quiz) return res.status(404).json({ error: 'Quiz not found' });

    let score = 0;
    const results = [];
    const weakAreas = [];

    for (const answer of answers) {
      const question = quiz.questions.find((q) => q.id === answer.questionId);
      if (!question) continue;
      const correct = question.correctAnswer === answer.selectedOption;
      if (correct) score++;
      else if (question.topic && !weakAreas.includes(question.topic)) weakAreas.push(question.topic);
      results.push({
        questionId: answer.questionId, correct,
        correctAnswer: question.correctAnswer,
        explanation: question.explanation,
        yourAnswer: answer.selectedOption
      });
    }

    const percentage = Math.round((score / quiz.questions.length) * 100);
    const xpEarned = score * 10 + (percentage === 100 ? 50 : 0);

    const attempt = await QuizAttempt.create({
      studentId: req.user.userId, quizId, quizMode: 'standard',
      answers: results.map((r) => ({ questionId: r.questionId, selectedOption: r.yourAnswer, correct: r.correct })),
      score, percentage, timeTaken: timeTaken || 0, weakAreas, xpEarned
    });

    const newBadges = await checkAndAwardBadges(req.user.userId, 'quiz_complete', { percentage, quizMode: 'standard' });

    const nextDifficulty = percentage >= 80 ? 'advanced' : percentage <= 40 ? 'beginner' : 'intermediate';

    res.json({
      score, percentage, timeTaken, results, weakAreas,
      recommendations: weakAreas.map((w) => `Review ${w} concepts`),
      xpEarned, badgesEarned: newBadges.map((b) => b.name), nextDifficulty
    });
  } catch (error) {
    res.status(500).json({ error: error.message, code: 500 });
  }
});

router.get('/history', async (req, res) => {
  try {
    const attempts = await QuizAttempt.find({ studentId: req.user.userId })
      .populate('quizId', 'topic difficulty')
      .sort({ createdAt: -1 });
    res.json({ attempts });
  } catch (error) {
    res.status(500).json({ error: error.message, code: 500 });
  }
});

router.post('/camo/validate', async (req, res) => {
  try {
    const { quizId, questionId, gestureResult } = req.body;
    const quiz = await Quiz.findById(quizId);
    if (!quiz) return res.status(404).json({ error: 'Quiz not found' });

    const question = quiz.questions.find((q) => q.id === questionId);
    if (!question) return res.status(404).json({ error: 'Question not found' });

    const optionMap = { A: 0, B: 1, C: 2, D: 3 };
    const selectedOption = question.options[optionMap[gestureResult]] || '';
    const correct = selectedOption === question.correctAnswer;
    const xpDelta = correct ? 15 : -5;

    res.json({ correct, correctAnswer: question.correctAnswer, explanation: question.explanation, xpDelta });
  } catch (error) {
    res.status(500).json({ error: error.message, code: 500 });
  }
});

export default router;
