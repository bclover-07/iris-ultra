import { Annotation, StateGraph, START, END } from '@langchain/langgraph';
import { callGeminiJSON } from '../services/gemini.service.js';

const CareerState = Annotation.Root({
  interests: Annotation({ reducer: (a, b) => b ?? a, default: () => [] }),
  cgpa: Annotation({ reducer: (a, b) => b ?? a, default: () => 0 }),
  skills: Annotation({ reducer: (a, b) => b ?? a, default: () => [] }),
  targetCompanies: Annotation({ reducer: (a, b) => b ?? a, default: () => [] }),
  semester: Annotation({ reducer: (a, b) => b ?? a, default: () => 1 }),
  marketInsights: Annotation({ reducer: (a, b) => b ?? a, default: () => ({}) }),
  skillGaps: Annotation({ reducer: (a, b) => b ?? a, default: () => ({}) }),
  trajectories: Annotation({ reducer: (a, b) => b ?? a, default: () => [] }),
  resumeMatch: Annotation({ reducer: (a, b) => b ?? a, default: () => ({}) }),
  riskTier: Annotation({ reducer: (a, b) => b ?? a, default: () => 'low' })
});

async function marketResearchNode(state) {
  try {
    const isCritical = state.riskTier === 'critical' || state.riskTier === 'high';
    const prompt = isCritical
      ? `Analyze the high-yield, short-term vocational certificate market (max 6 months completion, e.g. Google Data Analytics, AWS Cloud, Google IT Support, Salesforce Administrator, etc.) for a student at critical risk of academic dropout with these interests: ${state.interests.join(', ')}.
Target companies: any companies hiring certificate holders.

Return JSON:
{
  "trendingSkills": ["top 5 certification-related skills"],
  "growthSectors": ["top 3 entry-level fields"],
  "demandScore": number 0-100 representing vocational job demand,
  "avgSalary": "expected entry-level salary range with certificate",
  "topRoles": ["top 5 job roles matching certificates"]
}`
      : `Analyze the current job market for a student with these interests: ${state.interests.join(', ')}.
Target companies: ${state.targetCompanies.join(', ') || 'any top companies'}.

Return JSON:
{
  "trendingSkills": ["top 5 trending skills in these areas"],
  "growthSectors": ["top 3 growth sectors"],
  "demandScore": number 0-100 representing job demand,
  "avgSalary": "expected starting salary range",
  "topRoles": ["top 5 job roles matching interests"]
}`;
    const marketInsights = await callGeminiJSON(prompt);
    return { marketInsights };
  } catch (err) {
    console.error('Market research AI failed, using data-driven fallback:', err.message);
    const interestStr = state.interests.join(', ') || 'technology';
    return {
      marketInsights: {
        trendingSkills: ['Python', 'Machine Learning', 'React', 'Cloud Computing', 'Data Analysis'],
        growthSectors: ['Artificial Intelligence', 'Cloud Services', 'Cybersecurity'],
        demandScore: 78,
        avgSalary: '₹4L - ₹12L per annum',
        topRoles: [`${interestStr} Developer`, 'Data Analyst', 'Cloud Engineer', 'Full Stack Developer', 'ML Engineer']
      }
    };
  }
}

async function skillGapNode(state) {
  try {
    const prompt = `Compare this student's profile to job requirements:
Student skills: ${state.skills.join(', ')}
Student CGPA: ${state.cgpa}
Required trending skills: ${state.marketInsights?.trendingSkills?.join(', ') || 'unknown'}
Target roles: ${state.marketInsights?.topRoles?.join(', ') || 'software engineer'}

Return JSON:
{
  "score": number 0-100 skill match score,
  "gaps": ["skills the student needs to learn"],
  "strengths": ["student's strong areas"],
  "priority": ["top 3 skills to learn first"]
}`;
    const resumeMatch = await callGeminiJSON(prompt);
    return { resumeMatch };
  } catch (err) {
    console.error('Skill gap AI failed, using heuristic fallback:', err.message);
    const trendingSkills = state.marketInsights?.trendingSkills || [];
    const studentSkills = state.skills || [];
    const gaps = trendingSkills.filter(s => !studentSkills.some(ss => ss.toLowerCase().includes(s.toLowerCase())));
    const strengths = studentSkills.filter(s => trendingSkills.some(ts => ts.toLowerCase().includes(s.toLowerCase())));
    const score = studentSkills.length > 0 ? Math.min(90, Math.round((strengths.length / Math.max(trendingSkills.length, 1)) * 100)) : 30;

    return {
      resumeMatch: {
        score,
        gaps: gaps.length > 0 ? gaps.slice(0, 5) : ['System Design', 'Cloud Computing', 'Data Structures'],
        strengths: strengths.length > 0 ? strengths : studentSkills.slice(0, 3),
        priority: gaps.slice(0, 3).length > 0 ? gaps.slice(0, 3) : ['System Design', 'Cloud Computing', 'Technical Writing']
      }
    };
  }
}

async function timelineNode(state) {
  try {
    const isCritical = state.riskTier === 'critical' || state.riskTier === 'high';
    const prompt = isCritical
      ? `Create exactly 3 short-term, high-yield vocational or certificate-based career trajectories (Google Data Analytics, AWS Cloud Practitioner, Salesforce Administrator, etc.) for a student at critical dropout risk:
- Interests: ${state.interests.join(', ')}
- Current skills: ${state.skills.join(', ')}
- Market demand: ${state.marketInsights?.demandScore || 50}/100

Return JSON array of exactly 3 trajectories:
[
  {
    "type": "conservative",
    "title": "Short-term Certificate Path title",
    "probability": number 0-100,
    "targetRole": "entry-level vocational role",
    "expectedSalary": "vocational starting salary",
    "milestones": [
      { "month": 1, "title": "milestone title", "description": "details", "skills": ["skill1"] },
      { "month": 6, "title": "milestone title", "description": "details", "skills": ["skill1"] }
    ],
    "actions": ["specific action items"],
    "narrative": "2-3 sentence narrative of this path"
  },
  { "type": "ambitious", ... same structure },
  { "type": "wildcard", ... same structure }
]`
      : `Create 3 career trajectories for a student:
- Interests: ${state.interests.join(', ')}
- CGPA: ${state.cgpa}, Semester: ${state.semester}
- Current skills: ${state.skills.join(', ')}
- Skill gaps: ${state.resumeMatch?.gaps?.join(', ') || 'none identified'}
- Target companies: ${state.targetCompanies.join(', ') || 'top tech companies'}
- Market demand: ${state.marketInsights?.demandScore || 50}/100

Return JSON array of exactly 3 trajectories:
[
  {
    "type": "conservative",
    "title": "Conservative Path title",
    "probability": number 0-100,
    "targetRole": "specific job role",
    "expectedSalary": "salary range",
    "milestones": [
      { "month": 1, "title": "milestone", "description": "details", "skills": ["skill1"] }
    ],
    "actions": ["specific action items"],
    "narrative": "2-3 sentence narrative of this path"
  },
  { "type": "ambitious", ... },
  { "type": "wildcard", ... }
]

Conservative = safe, high probability. Ambitious = stretch goal. Wildcard = unconventional but exciting.`;

    const trajectories = await callGeminiJSON(prompt);
    return { trajectories: Array.isArray(trajectories) ? trajectories : [] };
  } catch (err) {
    console.error('Timeline AI failed, using interest-based fallback:', err.message);
    const interest = state.interests[0] || 'Technology';
    return {
      trajectories: [
        {
          type: 'conservative',
          title: `${interest} - Corporate Development Path`,
          probability: 82,
          targetRole: `Junior ${interest} Engineer`,
          expectedSalary: '₹4L - ₹8L',
          milestones: [
            { month: 3, title: 'Skill Building', description: `Complete foundational ${interest} certifications and build 2 portfolio projects`, skills: state.skills.slice(0, 2) },
            { month: 6, title: 'Internship', description: 'Secure an internship at a mid-tier company to gain real-world experience', skills: ['Communication', 'Teamwork'] },
            { month: 12, title: 'Full-Time Role', description: `Land a junior ${interest} role at a reputable company`, skills: ['Problem Solving'] }
          ],
          actions: ['Complete 3 online courses', 'Build portfolio website', 'Apply to 20+ companies'],
          narrative: `A structured path focused on building strong ${interest} fundamentals through certifications and internships, leading to a stable corporate career.`
        },
        {
          type: 'ambitious',
          title: `${interest} - Startup Technical Lead`,
          probability: 45,
          targetRole: `Senior ${interest} Developer / Tech Lead`,
          expectedSalary: '₹8L - ₹18L + Equity',
          milestones: [
            { month: 2, title: 'Open Source', description: 'Contribute to major open source projects', skills: ['Git', 'Collaboration'] },
            { month: 6, title: 'Startup Join', description: 'Join a well-funded early-stage startup', skills: ['Full Stack'] },
            { month: 12, title: 'Lead Role', description: 'Grow into a technical lead position', skills: ['Leadership'] }
          ],
          actions: ['Build 3 complex projects', 'Network at tech meetups', 'Start a tech blog'],
          narrative: `A high-ambition path targeting startup environments where rapid growth and technical leadership opportunities are abundant.`
        },
        {
          type: 'wildcard',
          title: `${interest} - Indie Creator & Consultant`,
          probability: 30,
          targetRole: 'Independent Consultant / Content Creator',
          expectedSalary: '₹5L - ₹25L (variable)',
          milestones: [
            { month: 3, title: 'Content Creation', description: `Start creating ${interest} tutorials and technical content`, skills: ['Communication'] },
            { month: 8, title: 'First Clients', description: 'Land first freelance consulting clients', skills: ['Business Development'] },
            { month: 14, title: 'Full Independence', description: 'Sustain full-time independent income', skills: ['Marketing'] }
          ],
          actions: ['Master a niche technology', 'Build personal brand online', 'Create a course or ebook'],
          narrative: `An unconventional but potentially highly rewarding path focusing on building expertise and monetizing knowledge through content creation and consulting.`
        }
      ]
    };
  }
}

async function riskNode(state) {
  const updated = (state.trajectories || []).map(t => ({
    ...t,
    probability: Math.min(99, Math.max(5, t.probability || 50))
  }));
  return { trajectories: updated };
}

const careerSimulatorGraph = new StateGraph(CareerState)
  .addNode('marketResearch', marketResearchNode)
  .addNode('skillGap', skillGapNode)
  .addNode('timeline', timelineNode)
  .addNode('risk', riskNode)
  .addEdge(START, 'marketResearch')
  .addEdge('marketResearch', 'skillGap')
  .addEdge('skillGap', 'timeline')
  .addEdge('timeline', 'risk')
  .addEdge('risk', END);

export const runCareerSimulator = async (input) => {
  const compiled = careerSimulatorGraph.compile();
  return await compiled.invoke(input);
};

export default careerSimulatorGraph;
