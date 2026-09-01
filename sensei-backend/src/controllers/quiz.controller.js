import QuizAttempt from '../models/QuizAttempt.js';
import StudentProfile from '../models/StudentProfile.js';

const defaultQuestionBank = [
  { id: 'q1', question: 'Which time complexity represents Binary Search?', options: ['O(n)', 'O(log n)', 'O(n^2)', 'O(1)'], correctAnswer: 'O(log n)', subject: 'Algorithms', difficulty: 'Easy' },
  { id: 'q2', question: 'What does NPU stand for in mobile architectures?', options: ['Network Processing Unit', 'Neural Processing Unit', 'Node Pixel Unit', 'Native Protocol Unit'], correctAnswer: 'Neural Processing Unit', subject: 'Hardware', difficulty: 'Easy' },
  { id: 'q3', question: 'Which Qualcomm accelerator powers on-device Hexagon inference?', options: ['Adreno GPU', 'Kryo CPU', 'Hexagon QNN / HTP', 'FastRPC Hub'], correctAnswer: 'Hexagon QNN / HTP', subject: 'AI Architecture', difficulty: 'Medium' },
  { id: 'q4', question: 'In 4-7-8 breathing, how many seconds is the breath held?', options: ['4 seconds', '7 seconds', '8 seconds', '5 seconds'], correctAnswer: '7 seconds', subject: 'Wellness', difficulty: 'Easy' },
  { id: 'q5', question: 'What is the optimal substructure property in dynamic programming?', options: ['Subproblems overlap', 'Optimal solution contains optimal sub-solutions', 'Greedy choices yield global optima', 'Linear memory overhead'], correctAnswer: 'Optimal solution contains optimal sub-solutions', subject: 'Computer Science', difficulty: 'Medium' },
  { id: 'q6', question: 'Which data structure is typically used for Breadth-First Search?', options: ['Stack', 'Queue', 'Heap', 'Hash Table'], correctAnswer: 'Queue', subject: 'Data Structures', difficulty: 'Easy' },
  { id: 'q7', question: 'What is the primary benefit of INT8 quantization on Hexagon NPUs?', options: ['Higher memory consumption', 'Lower latency and 3-4x energy efficiency', 'Exact floating point identity', 'No compiler support required'], correctAnswer: 'Lower latency and 3-4x energy efficiency', subject: 'AI Architecture', difficulty: 'Hard' },
  { id: 'q8', question: 'Which sorting algorithm has the best average-case performance?', options: ['Bubble Sort', 'Insertion Sort', 'Merge Sort', 'Selection Sort'], correctAnswer: 'Merge Sort', subject: 'Algorithms', difficulty: 'Easy' }
];

export const getQuizBank = async (req, res) => {
  try {
    const topic = req.params.topic;
    let filtered = defaultQuestionBank;
    if (topic && topic !== 'all' && topic !== 'General') {
      filtered = defaultQuestionBank.filter(q => q.subject?.toLowerCase() === topic.toLowerCase());
      if (filtered.length === 0) filtered = defaultQuestionBank;
    }
    const shuffled = [...filtered].sort(() => 0.5 - Math.random()).slice(0, 10);
    res.json({ questions: shuffled, count: shuffled.length });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const submitQuizAttempt = async (req, res) => {
  try {
    const { mode, answers, timeSpentSeconds, gestureAccuracy } = req.body;
    let score = 0;
    const graded = (answers || []).map(a => {
      const q = defaultQuestionBank.find(item => item.id === a.questionId || item.question === a.question);
      const isCorrect = q ? q.correctAnswer === a.selectedOption : a.isCorrect;
      if (isCorrect) score += 1;
      return {
        question: a.question || q?.question,
        selectedOption: a.selectedOption,
        correctOption: q?.correctAnswer,
        isCorrect
      };
    });

    const total = answers?.length || 1;
    const accuracy = Math.round((score / total) * 100);
    const xpEarned = score * 20 + (mode === 'camo' ? 50 : 20);

    const attempt = await QuizAttempt.create({
      userId: req.user.userId,
      mode: mode || 'camo',
      score,
      totalQuestions: total,
      accuracy,
      xpEarned,
      timeSpentSeconds: timeSpentSeconds || 60,
      gestureAccuracy: gestureAccuracy || 95,
      answers: graded
    });

    let profile = await StudentProfile.findOne({ userId: req.user.userId });
    if (profile) {
      profile.quizMastery.totalAnswered += total;
      profile.quizMastery.totalCorrect += score;
      profile.quizMastery.score = Math.round((profile.quizMastery.totalCorrect / profile.quizMastery.totalAnswered) * 100);
      profile.xp += xpEarned;
      profile.level = Math.floor(profile.xp / 500) + 1;
      await profile.save();
    }

    res.status(201).json({
      attemptId: attempt._id,
      score,
      totalQuestions: total,
      accuracy,
      xpEarned,
      message: accuracy >= 80 ? 'Mastery Level Achieved! 🔥' : 'Good effort! Keep drilling.'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getQuizHistory = async (req, res) => {
  try {
    const history = await QuizAttempt.find({ userId: req.user.userId })
      .sort({ createdAt: -1 })
      .limit(10);
    res.json(history);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export default { getQuizBank, submitQuizAttempt, getQuizHistory };
