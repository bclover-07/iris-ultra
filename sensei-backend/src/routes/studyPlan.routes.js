import { Router } from 'express';
import { verifyAccessToken } from '../middleware/auth.middleware.js';
import { requireRole } from '../middleware/role.middleware.js';
import { callGemini, callGeminiJSON } from '../services/gemini.service.js';
import StudyPlan from '../models/StudyPlan.js';
import Intervention from '../models/Intervention.js';
import User from '../models/User.js';
import { getStudentPerformance } from '../services/performance.service.js';
import { analyzeVideo } from '../agents/videoAnalyzer.agent.js';
import { sendStudyPlanEmail } from '../services/email.service.js';

const router = Router();
router.use(verifyAccessToken, requireRole('student'));

router.post('/generate', async (req, res) => {
  try {
    const { planType, mode, topic, interventionId, videoUrl, days, hoursPerDay } = req.body;
    let perf;
    try {
      perf = await getStudentPerformance(req.user.userId);
    } catch (perfErr) {
      console.error('Performance fetch error:', perfErr);
      perf = { cgpa: 0, risk: { reason: 'No data available' } };
    }

    let context = topic || '';
    if (mode === 'intervention' && interventionId) {
      const intervention = await Intervention.findById(interventionId);
      if (intervention) context = intervention.message;
    }

    let videoSummary = null;
    let summaryCards = [];
    let charts = [];
    let diagrams = [];
    let chapters = [];

    if (planType === 'advanced' && videoUrl) {
      try {
        console.log('[StudyPlan] Running LangGraph video analyzer for:', videoUrl);
        const videoResult = await analyzeVideo(videoUrl);

        if (videoResult.error) {
          console.error('[StudyPlan] Video analysis error:', videoResult.error);
        } else {
          videoSummary = videoResult.summary || null;
          summaryCards = videoResult.summaryCards || [];
          charts = videoResult.charts || [];
          diagrams = videoResult.diagrams || [];
          chapters = videoResult.chapters || [];
        }
      } catch (e) {
        console.error('[StudyPlan] Video Analysis Pipeline Error:', e.message);
        videoSummary = null;
      }
    }

    if (planType === 'advanced' && !videoUrl) {
      try {
        const advancedVisualsPrompt = `Create rich visual learning aids for the topic "${context}".

Return ONLY valid JSON:
{
  "charts": [
    {
      "type": "progress",
      "title": "Topic Mastery Roadmap",
      "data": [
        { "name": "Fundamentals", "value": 25, "color": "#10B981" },
        { "name": "Core Concepts", "value": 35, "color": "#3B82F6" },
        { "name": "Applications", "value": 25, "color": "#8B5CF6" },
        { "name": "Advanced", "value": 15, "color": "#F59E0B" }
      ]
    },
    {
      "type": "radar",
      "title": "Skill Areas Coverage",
      "data": [
        { "skill": "Theory", "value": 85 },
        { "skill": "Practice", "value": 70 },
        { "skill": "Problem Solving", "value": 75 },
        { "skill": "Application", "value": 65 },
        { "skill": "Analysis", "value": 80 }
      ]
    },
    {
      "type": "timeline",
      "title": "Learning Phases",
      "data": [
        { "phase": "Foundation", "duration": "3 days", "topics": 4 },
        { "phase": "Deep Dive", "duration": "5 days", "topics": 6 },
        { "phase": "Practice", "duration": "4 days", "topics": 5 },
        { "phase": "Mastery", "duration": "2 days", "topics": 3 }
      ]
    }
  ],
  "diagrams": [
    {
      "type": "flowchart",
      "title": "Learning Path for ${context}",
      "nodes": [
        { "id": "1", "label": "Prerequisites", "type": "start" },
        { "id": "2", "label": "Core Fundamentals", "type": "process" },
        { "id": "3", "label": "Key Techniques", "type": "process" },
        { "id": "4", "label": "Real-World Projects", "type": "process" },
        { "id": "5", "label": "Expert Level", "type": "end" }
      ],
      "edges": [
        { "from": "1", "to": "2" },
        { "from": "2", "to": "3" },
        { "from": "3", "to": "4" },
        { "from": "4", "to": "5" }
      ]
    }
  ],
  "summaryCards": [
    { "title": "Why Learn This?", "keyPoint": "Brief motivation for the topic", "emoji": "🎯", "color": "#8B5CF6", "category": "motivation" },
    { "title": "Core Principle", "keyPoint": "The most important foundational concept", "emoji": "💡", "color": "#3B82F6", "category": "concept" },
    { "title": "Common Pitfall", "keyPoint": "A frequent mistake to avoid", "emoji": "⚠️", "color": "#EF4444", "category": "warning" },
    { "title": "Pro Tip", "keyPoint": "An advanced technique for mastery", "emoji": "⚡", "color": "#10B981", "category": "technique" },
    { "title": "Real Application", "keyPoint": "How this is used in industry", "emoji": "🏢", "color": "#F59E0B", "category": "application" },
    { "title": "Key Takeaway", "keyPoint": "The single most important thing to remember", "emoji": "🧠", "color": "#06B6D4", "category": "summary" }
  ]
}`;
        const visuals = await callGeminiJSON(advancedVisualsPrompt);
        charts = visuals.charts || [];
        diagrams = visuals.diagrams || [];
        summaryCards = visuals.summaryCards || [];
      } catch (e) {
        console.error('[StudyPlan] Advanced visuals generation error:', e.message);
      }
    }

    const weakAreas = perf?.risk?.reason || 'General improvement needed';
    const studentCgpa = perf?.cgpa || 0;
    const numDays = parseInt(days) || (planType === 'advanced' ? 14 : 7);
    const dailyHours = parseInt(hoursPerDay) || 2;

    const planPrompt = `Create a ${numDays}-day study plan for "${context}".
Student CGPA: ${studentCgpa}, Weak areas: ${weakAreas}.
Daily study duration: ${dailyHours} hours.
${videoSummary?.summary ? `Integrate video content: ${videoSummary.summary.slice(0, 500)}` : ''}
Return ONLY valid JSON with this exact structure: { "title": "Study Plan: ${context}", "totalDays": ${numDays}, "dailySessions": [{ "day": 1, "topics": ["topic1", "topic2"], "activities": ["activity1"], "resources": ["resource1"] }] }`;

    let plan;
    try {
      console.log('[StudyPlan] Generating plan for topic:', context);
      plan = await callGeminiJSON(planPrompt);
      console.log('[StudyPlan] Plan generated successfully:', plan?.title);
    } catch (aiError) {
      console.warn('[StudyPlan] AI failed, using fallback plan:', aiError.message);
      plan = {
        title: `Fallback Study Plan: ${context || 'General Topic'}`,
        totalDays: numDays,
        dailySessions: Array.from({ length: numDays }).map((_, i) => ({
          day: i + 1,
          topics: [`Introduction to ${context}`, `Core Concepts Part ${i + 1}`],
          activities: ['Read the provided materials', 'Complete practice exercises'],
          resources: ['Textbook Chapter', 'Online Tutorials']
        }))
      };
    }

    const savedPlan = await StudyPlan.create({
      studentId: req.user.userId, planType, mode, topic: context,
      interventionId: mode === 'intervention' ? interventionId : undefined,
      title: plan.title || `Study Plan: ${context}`,
      totalDays: plan.totalDays || numDays,
      hoursPerDay: dailyHours,
      dailySessions: plan.dailySessions || [],
      videoUrl, videoSummary, summaryCards, charts, diagrams, chapters
    });

    res.json({
      planId: savedPlan._id, title: savedPlan.title,
      totalDays: savedPlan.totalDays, dailySessions: savedPlan.dailySessions,
      videoSummary, summaryCards, charts, diagrams, chapters,
      planType: savedPlan.planType, createdAt: savedPlan.createdAt
    });
  } catch (error) {
    console.error('[StudyPlan] Generation error:', error.message);
    res.status(500).json({ error: error.message, code: 500 });
  }
});

router.post('/:planId/send-email', async (req, res) => {
  try {
    const { email } = req.body;
    const plan = await StudyPlan.findById(req.params.planId);
    if (!plan) return res.status(404).json({ error: 'Plan not found' });
    if (plan.studentId.toString() !== req.user.userId.toString()) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const user = await User.findById(req.user.userId);
    const recipientEmail = email || user?.email;
    if (!recipientEmail) {
      return res.status(400).json({ error: 'No email address provided' });
    }

    const isAdvanced = plan.planType === 'advanced';
    const result = await sendStudyPlanEmail(recipientEmail, user?.name || 'Student', plan, isAdvanced);

    plan.emailSent = true;
    plan.emailSentAt = new Date();
    plan.emailSentTo = recipientEmail;
    await plan.save();

    res.json({ success: true, messageId: result.messageId, sentTo: recipientEmail });
  } catch (error) {
    console.error('[StudyPlan] Email send error:', error.message);
    res.status(500).json({ error: `Failed to send email: ${error.message}`, code: 500 });
  }
});

router.get('/my-plans', async (req, res) => {
  try {
    const { type, page = 1, limit = 20 } = req.query;
    const filter = { studentId: req.user.userId };
    if (type && ['normal', 'advanced'].includes(type)) {
      filter.planType = type;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [plans, total] = await Promise.all([
      StudyPlan.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .select('title planType mode topic createdAt progress totalDays videoUrl emailSent'),
      StudyPlan.countDocuments(filter)
    ]);

    res.json({
      plans,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message, code: 500 });
  }
});

router.get('/history/stats', async (req, res) => {
  try {
    const studentId = req.user.userId;

    const [totalPlans, normalCount, advancedCount, completedPlans, recentPlans] = await Promise.all([
      StudyPlan.countDocuments({ studentId }),
      StudyPlan.countDocuments({ studentId, planType: 'normal' }),
      StudyPlan.countDocuments({ studentId, planType: 'advanced' }),
      StudyPlan.countDocuments({ studentId, progress: 100 }),
      StudyPlan.find({ studentId }).sort({ createdAt: -1 }).limit(5)
        .select('title planType progress createdAt totalDays')
    ]);

    const avgProgress = totalPlans > 0
      ? await StudyPlan.aggregate([
          { $match: { studentId: req.user.userId } },
          { $group: { _id: null, avg: { $avg: '$progress' } } }
        ]).then(r => Math.round(r[0]?.avg || 0))
      : 0;

    res.json({
      totalPlans,
      normalCount,
      advancedCount,
      completedPlans,
      avgProgress,
      recentPlans
    });
  } catch (error) {
    res.status(500).json({ error: error.message, code: 500 });
  }
});

router.get('/:planId', async (req, res) => {
  try {
    const plan = await StudyPlan.findById(req.params.planId);
    if (!plan) return res.status(404).json({ error: 'Plan not found' });
    res.json(plan);
  } catch (error) {
    res.status(500).json({ error: error.message, code: 500 });
  }
});

router.patch('/:planId/progress', async (req, res) => {
  try {
    const { completedDay } = req.body;
    const plan = await StudyPlan.findById(req.params.planId);
    if (!plan) return res.status(404).json({ error: 'Plan not found' });

    if (plan.dailySessions[completedDay - 1]) {
      plan.dailySessions[completedDay - 1].completed = true;
    }
    const completed = plan.dailySessions.filter((s) => s.completed).length;
    plan.progress = Math.round((completed / plan.totalDays) * 100);
    await plan.save();

    res.json({ progress: plan.progress });
  } catch (error) {
    res.status(500).json({ error: error.message, code: 500 });
  }
});

router.delete('/:planId', async (req, res) => {
  try {
    const plan = await StudyPlan.findById(req.params.planId);
    if (!plan) return res.status(404).json({ error: 'Plan not found' });
    if (plan.studentId.toString() !== req.user.userId.toString()) {
      return res.status(403).json({ error: 'Not authorized' });
    }
    await StudyPlan.findByIdAndDelete(req.params.planId);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message, code: 500 });
  }
});

export default router;
