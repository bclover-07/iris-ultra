import InterviewSession from '../models/InterviewSession.js';
import InterviewReport from '../models/InterviewReport.js';
import StudentProfile from '../models/StudentProfile.js';
import { callGeminiJSON } from '../services/gemini.service.js';

export const startInterview = async (req, res) => {
  try {
    const { company, role, difficulty } = req.body;

    const initialQuestions = [
      "Can you explain how you would design a rate limiter for an API with millions of concurrent users?",
      "Walk me through the difference between optimistic and pessimistic locking in distributed databases.",
      "How do you optimize deep learning model inference on mobile edge devices with memory constraints?",
      "Describe a scenario where you had to debug a complex race condition in concurrent asynchronous code.",
      "What are the latency and thermal tradeoffs between executing on an NPU vs a mobile GPU?"
    ];

    const session = await InterviewSession.create({
      userId: req.user.userId,
      company: company || 'Qualcomm / Google',
      role: role || 'AI Systems Engineer',
      difficulty: difficulty || 'Intermediate',
      questions: initialQuestions,
      currentQuestionIndex: 0,
      status: 'in_progress'
    });

    res.status(201).json({
      sessionId: session._id,
      company: session.company,
      role: session.role,
      firstQuestion: initialQuestions[0],
      totalQuestions: initialQuestions.length
    });
  } catch (error) {
    console.error('Interview start error:', error);
    res.status(500).json({ error: error.message });
  }
};

export const scoreAnswer = async (req, res) => {
  try {
    const { question, studentAnswer, role, company } = req.body;

    const prompt = `Grade this technical interview response:
Target Role: ${role || 'Software Engineer'}
Target Company: ${company || 'Top Tech Firm'}
Question: ${question}
Student's Spoken Answer: ${studentAnswer}`;

    const score = await callGeminiJSON(prompt, {
      systemPrompt: 'You are a senior technical interviewer scoring candidate answers.'
    });

    res.json(score);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const finalizeInterview = async (req, res) => {
  try {
    const { sessionId, company, role, turns, faceMeshConfidenceAvg } = req.body;

    const avgTech = Math.round((turns || []).reduce((acc, t) => acc + (t.technicalScore || 85), 0) / Math.max(1, (turns || []).length));
    const avgClarity = Math.round((turns || []).reduce((acc, t) => acc + (t.clarityScore || 88), 0) / Math.max(1, (turns || []).length));
    const overallScore = Math.round((avgTech + avgClarity) / 2);

    const report = await InterviewReport.create({
      userId: req.user.userId,
      sessionId,
      company: company || 'Tech Firm',
      role: role || 'Software Engineer',
      scores: {
        technicalAccuracy: avgTech,
        communicationClarity: avgClarity,
        deliveryConfidence: Math.round((faceMeshConfidenceAvg || 0.9) * 100),
        overallScore
      },
      turns: turns || [],
      recommendation: overallScore >= 80 ? 'Strong Hire / Advance to Next Round' : 'Promising Candidate / Needs System Design Practice'
    });

    let profile = await StudentProfile.findOne({ userId: req.user.userId });
    if (profile) {
      profile.engagement.practiceSessionsCount += 1;
      profile.xp += 75;
      await profile.save();
    }

    res.json(report);
  } catch (error) {
    console.error('Interview finalize error:', error);
    res.status(500).json({ error: error.message });
  }
};

export const getInterviewHistory = async (req, res) => {
  try {
    const reports = await InterviewReport.find({ userId: req.user.userId })
      .sort({ createdAt: -1 })
      .limit(10);
    res.json(reports);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export default { startInterview, scoreAnswer, finalizeInterview, getInterviewHistory };
