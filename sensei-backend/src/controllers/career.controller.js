import CareerSimulation from '../models/CareerSimulation.js';
import StudentProfile from '../models/StudentProfile.js';
import { callGeminiJSON } from '../services/gemini.service.js';

export const simulateCareer = async (req, res) => {
  try {
    const { interests, skills, targetCompanies } = req.body;
    if (!interests?.length) return res.status(400).json({ error: 'Provide at least one interest' });

    let riskTier = 'low';
    let quizMasteryScore = 80;
    try {
      const profile = await StudentProfile.findOne({ userId: req.user.userId });
      if (profile) {
        riskTier = profile.riskModel?.riskTier || 'low';
        quizMasteryScore = profile.quizMastery?.score || 80;
      }
    } catch (e) {
      console.warn('[Career] Profile lookup failed:', e.message);
    }

    const prompt = `Generate career trajectory analysis for a student:
Interests: ${interests.join(', ')}
Skills: ${(skills || []).join(', ')}
Target Companies: ${(targetCompanies || []).join(', ')}
Quiz Mastery Score: ${quizMasteryScore}/100
Risk Tier: ${riskTier}

Return JSON with:
{
  "marketInsights": { "marketDemand": string, "averageSalary": string, "topHiringCompanies": [string], "keySkillsInDemand": [string], "growthForecast": string },
  "trajectories": [
    { "type": "Conservative", "description": string, "outcomes": { "p10": string, "p50": string, "p90": string } },
    { "type": "Ambitious", "description": string, "outcomes": { "p10": string, "p50": string, "p90": string } },
    { "type": "Wildcard", "description": string, "outcomes": { "p10": string, "p50": string, "p90": string } }
  ],
  "resumeMatch": { "matchScore": number, "gaps": [string], "recommendations": [string] }
}`;

    const result = await callGeminiJSON(prompt, {
      systemPrompt: 'You are a career advisor analyzing market trends and providing data-driven trajectory projections.'
    });

    const simulation = await CareerSimulation.create({
      studentId: req.user.userId,
      inputs: { interests, skills, targetCompanies },
      trajectories: result.trajectories || [],
      marketInsights: result.marketInsights || {},
      resumeMatch: result.resumeMatch || {}
    });

    let profile = await StudentProfile.findOne({ userId: req.user.userId });
    if (profile) {
      profile.xp += 30;
      await profile.save();
    }

    res.json({
      simulationId: simulation._id,
      trajectories: result.trajectories,
      marketInsights: result.marketInsights,
      resumeMatch: result.resumeMatch
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getMarketData = async (req, res) => {
  try {
    const { field } = req.query;
    const prompt = `Provide current market data for the field: ${field || 'Software Engineering / AI'}
Return JSON: { "marketDemand": string, "averageSalary": string, "topHiringCompanies": [string], "keySkillsInDemand": [string], "growthForecast": string }`;

    const data = await callGeminiJSON(prompt, {
      systemPrompt: 'You are a labor market analyst providing concise, data-driven market insights.'
    });

    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getCareerHistory = async (req, res) => {
  try {
    const simulations = await CareerSimulation.find({ studentId: req.user.userId })
      .sort({ createdAt: -1 })
      .limit(10);
    res.json({ simulations });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export default { simulateCareer, getMarketData, getCareerHistory };
