import Doubt from '../models/Doubt.js';
import StudentProfile from '../models/StudentProfile.js';
import doubtSolverAgent from '../agents/doubtSolver.agent.js';

export const solveDoubt = async (req, res) => {
  try {
    const { question, subject, inputMode, extractedOcrText, isFormula } = req.body;
    if (!question && !extractedOcrText) {
      return res.status(400).json({ error: 'Question text or OCR text is required' });
    }

    const queryText = question || extractedOcrText;
    const result = await doubtSolverAgent.solveDoubt({
      queryText,
      subject: subject || 'Computer Science',
      isFormula: isFormula || false,
      ocrText: extractedOcrText
    });

    const doubt = await Doubt.create({
      userId: req.user.userId,
      question: queryText,
      subject: result.subject || subject || 'Computer Science',
      difficulty: result.difficulty || 'Medium',
      steps: result.steps || [],
      voiceNarrationText: result.voiceNarrationText,
      inputMode: inputMode || 'text',
      extractedOcrText
    });

    let profile = await StudentProfile.findOne({ userId: req.user.userId });
    if (profile) {
      profile.engagement.doubtSessionsCount += 1;
      profile.xp += 15;
      await profile.save();
    }

    res.status(201).json({
      id: doubt._id,
      question: doubt.question,
      subject: doubt.subject,
      difficulty: doubt.difficulty,
      steps: doubt.steps,
      voiceNarrationText: doubt.voiceNarrationText
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getDoubtHistory = async (req, res) => {
  try {
    const history = await Doubt.find({ userId: req.user.userId })
      .sort({ createdAt: -1 })
      .limit(10);
    res.json(history);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export default { solveDoubt, getDoubtHistory };
