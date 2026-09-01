import mongoose from 'mongoose';
import CareerSimulation from '../models/CareerSimulation.js';
import StudentProfile from '../models/StudentProfile.js';
import { callGeminiJSON } from '../services/gemini.service.js';

export const simulateCareer = async (req, res) => {
  try {
    const { interests, targetDomain, domain, skills, targetCompanies } = req.body;
    const finalInterests = interests?.length ? interests : [targetDomain || domain || 'Edge AI & Mobile Systems'];

    let riskTier = 'low';
    let quizMasteryScore = 80;
    if (mongoose.connection.readyState === 1) {
      try {
        const profile = await StudentProfile.findOne({ userId: req.user.userId });
        if (profile) {
          riskTier = profile.riskModel?.riskTier || 'low';
          quizMasteryScore = profile.quizMastery?.score || 80;
        }
      } catch (e) {
        console.warn('[Career] Profile lookup fallback:', e.message);
      }
    }

    let result;
    try {
      const prompt = `Generate career trajectory analysis for a student:
Interests: ${finalInterests.join(', ')}
Skills: ${(skills || ['Python', 'Dart/Flutter', 'On-Device AI']).join(', ')}
Target Companies: ${(targetCompanies || ['Qualcomm', 'iQOO / Vivo', 'Google DeepMind']).join(', ')}
Quiz Mastery Score: ${quizMasteryScore}/100
Risk Tier: ${riskTier}

Return JSON with:
{
  "marketInsights": { "marketDemand": "High (94th percentile)", "averageSalary": "$145,000 - $190,000", "topHiringCompanies": ["Qualcomm", "iQOO", "Google"], "keySkillsInDemand": ["LiteRT/QNN", "Hexagon NPU", "Flutter"], "growthForecast": "+28% YoY" },
  "trajectories": [
    { "type": "Conservative", "description": "Core Systems & Embedded AI Specialist", "outcomes": { "p10": "$110k", "p50": "$145k", "p90": "$180k" } },
    { "type": "Ambitious", "description": "Lead On-Device Edge AI Architect", "outcomes": { "p10": "$150k", "p50": "$210k", "p90": "$290k" } },
    { "type": "Wildcard", "description": "Autonomous AI Hardware Startup Founder", "outcomes": { "p10": "$80k", "p50": "$350k", "p90": "$1.2M+" } }
  ],
  "resumeMatch": { "matchScore": 88, "gaps": ["Hardware accelerated DSP compilation"], "recommendations": ["Complete Camo Quizo INT8 Quantization drill"] }
}`;
      result = await callGeminiJSON(prompt, {
        systemPrompt: 'You are a career advisor analyzing market trends and providing data-driven trajectory projections.'
      });
    } catch (_) {
      result = {
        targetDomain: finalInterests[0],
        marketInsights: {
          marketDemand: 'High (94th percentile)',
          averageSalary: '$145,000 - $195,000',
          topHiringCompanies: ['Qualcomm', 'iQOO / Vivo', 'Google DeepMind', 'Apple'],
          keySkillsInDemand: ['LiteRT / QNN Optimization', 'Hexagon NPU INT8 Quantization', 'Cross-Platform Edge AI'],
          growthForecast: '+32% YoY'
        },
        trajectories: [
          { type: 'Conservative', description: 'Systems Software Engineer (Embedded & Edge)', outcomes: { p10: '$115k', p50: '$148k', p90: '$185k' } },
          { type: 'Ambitious', description: 'Lead On-Device Edge Intelligence Architect', outcomes: { p10: '$160k', p50: '$225k', p90: '$310k' } },
          { type: 'Wildcard', description: 'Edge AI Silicon & Tooling Startup Founder', outcomes: { p10: '$90k', p50: '$400k', p90: '$1.5M+' } }
        ],
        resumeMatch: {
          matchScore: 91,
          gaps: ['Direct DSP assembly scheduling', 'Thermal-aware throttling loops'],
          recommendations: ['Build out end-to-end NPU Console telemetry', 'Practice Oxford-Style Technical Debates']
        }
      };
    }

    let simulationId = '66d000000000000000000401';
    if (mongoose.connection.readyState === 1) {
      try {
        const simulation = await CareerSimulation.create({
          studentId: req.user.userId,
          inputs: { interests: finalInterests, skills, targetCompanies },
          trajectories: result.trajectories || [],
          marketInsights: result.marketInsights || {},
          resumeMatch: result.resumeMatch || {}
        });
        simulationId = simulation._id;

        let profile = await StudentProfile.findOne({ userId: req.user.userId });
        if (profile) {
          profile.xp += 30;
          await profile.save();
        }
      } catch (_) {}
    }

    res.json({
      simulationId,
      targetDomain: finalInterests[0],
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
    res.json({
      field: field || 'Edge AI & Mobile Systems',
      marketDemand: 'Very High (96th percentile)',
      averageSalary: '$155,000',
      topHiringCompanies: ['Qualcomm', 'iQOO', 'NVIDIA', 'Google'],
      keySkillsInDemand: ['Hexagon NPU', 'QNN', 'MediaPipe', 'Flutter'],
      growthForecast: '+35% YoY'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getCareerHistory = async (req, res) => {
  try {
    let simulations = [];
    if (mongoose.connection.readyState === 1) {
      try {
        simulations = await CareerSimulation.find({ studentId: req.user.userId })
          .sort({ createdAt: -1 })
          .limit(10);
      } catch (_) {}
    }

    if (simulations.length === 0) {
      simulations = [
        {
          _id: 'sim_1',
          targetDomain: 'Edge AI & Mobile Systems',
          trajectories: [
            { type: 'Conservative', description: 'Embedded Systems Engineer', outcomes: { p10: '$115k', p50: '$148k', p90: '$185k' } },
            { type: 'Ambitious', description: 'Lead Edge AI Architect', outcomes: { p10: '$160k', p50: '$225k', p90: '$310k' } }
          ],
          createdAt: new Date().toISOString()
        }
      ];
    }

    res.json({ simulations });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export default { simulateCareer, getMarketData, getCareerHistory };
