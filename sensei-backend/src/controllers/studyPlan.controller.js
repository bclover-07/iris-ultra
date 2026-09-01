import StudyPlan from '../models/StudyPlan.js';
import StudentProfile from '../models/StudentProfile.js';
import geminiService from '../services/gemini.service.js';

export const generatePlan = async (req, res) => {
  try {
    const { focusSubject, targetDays, hoursPerDay, youtubeUrl, syllabusText } = req.body;
    const daysCount = parseInt(targetDays) || 7;
    const hours = parseFloat(hoursPerDay) || 2.5;

    const prompt = `You are an expert curriculum synthesizer. Create a day-by-day study plan for the subject "${focusSubject || syllabusText || 'Computer Science'}" over ${daysCount} days, with ${hours} hours/day. ${youtubeUrl ? `Based on YouTube lecture: ${youtubeUrl}` : ''}
Return a JSON object matching this structure:
{
  "title": "${focusSubject || 'Accelerated Study Plan'}",
  "subject": "${focusSubject || 'General'}",
  "targetDays": ${daysCount},
  "hoursPerDay": ${hours},
  "days": [
    {
      "dayNumber": 1,
      "topic": "Topic Name",
      "tasks": [
        { "title": "Task Description", "durationMinutes": 45, "completed": false }
      ]
    }
  ]
}`;

    let generated;
    try {
      generated = await geminiService.callGeminiJSON(prompt);
    } catch (_) {
      generated = {
        title: `${focusSubject || 'Accelerated'} Mastery Plan`,
        subject: focusSubject || 'General',
        targetDays: daysCount,
        hoursPerDay: hours,
        days: Array.from({ length: daysCount }, (_, i) => ({
          dayNumber: i + 1,
          topic: `Module ${i + 1}: ${focusSubject || 'Core Concepts'} Deep Dive`,
          tasks: [
            { title: 'Foundational Theory & Concept Notes', durationMinutes: 45, completed: false },
            { title: 'Worked Examples & Practice Exercises', durationMinutes: 45, completed: false },
            { title: 'Active Recall Drill on Camo Quizo', durationMinutes: 30, completed: false }
          ]
        }))
      };
    }

    await StudyPlan.updateMany({ userId: req.user.userId, isActive: true }, { isActive: false });

    const totalTasks = (generated.days || []).reduce((acc, d) => acc + (d.tasks?.length || 0), 0);

    const plan = await StudyPlan.create({
      userId: req.user.userId,
      title: generated.title || 'Custom Study Plan',
      subject: focusSubject || 'General',
      targetDays: daysCount,
      hoursPerDay: hours,
      days: generated.days || [],
      totalTasks,
      completedTasks: 0,
      progressPercent: 0,
      isActive: true
    });

    res.status(201).json(plan);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getActivePlan = async (req, res) => {
  try {
    const plan = await StudyPlan.findOne({ userId: req.user.userId, isActive: true }).sort({ createdAt: -1 });
    if (!plan) {
      const defaultPlan = await StudyPlan.create({
        userId: req.user.userId,
        title: 'Algorithms & Edge AI Sprint',
        subject: 'Computer Science',
        targetDays: 7,
        hoursPerDay: 2.5,
        days: [
          {
            dayNumber: 1,
            topic: 'Dynamic Programming & Recurrence Relations',
            tasks: [
              { title: 'Review Optimal Substructure and Memoization', durationMinutes: 45, completed: true },
              { title: 'Solve 3 1D DP Problems in Doubt Solver', durationMinutes: 45, completed: true },
              { title: 'Drill 5 questions on Camo Quizo', durationMinutes: 30, completed: false }
            ]
          },
          {
            dayNumber: 2,
            topic: 'Graph Algorithms & Shortest Path',
            tasks: [
              { title: 'Dijkstra and Bellman-Ford comparisons', durationMinutes: 50, completed: false },
              { title: 'Topological sorting implementation', durationMinutes: 40, completed: false }
            ]
          }
        ],
        totalTasks: 5,
        completedTasks: 2,
        progressPercent: 40,
        isActive: true
      });
      return res.json(defaultPlan);
    }
    res.json(plan);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const toggleTask = async (req, res) => {
  try {
    const { planId, dayNumber, taskIndex } = req.body;
    const plan = await StudyPlan.findOne({ _id: planId, userId: req.user.userId });
    if (!plan) return res.status(404).json({ error: 'Plan not found' });

    const day = plan.days.find(d => d.dayNumber === dayNumber);
    if (day && day.tasks && day.tasks[taskIndex]) {
      day.tasks[taskIndex].completed = !day.tasks[taskIndex].completed;
    }

    let completed = 0;
    let total = 0;
    plan.days.forEach(d => {
      d.tasks.forEach(t => {
        total += 1;
        if (t.completed) completed += 1;
      });
    });

    plan.completedTasks = completed;
    plan.totalTasks = total;
    plan.progressPercent = total > 0 ? Math.round((completed / total) * 100) : 0;
    await plan.save();

    let profile = await StudentProfile.findOne({ userId: req.user.userId });
    if (profile) {
      profile.studyPlanProgress.completedTasks = completed;
      profile.studyPlanProgress.totalTasks = total;
      profile.studyPlanProgress.score = plan.progressPercent;
      await profile.save();
    }

    res.json(plan);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export default { generatePlan, getActivePlan, toggleTask };
