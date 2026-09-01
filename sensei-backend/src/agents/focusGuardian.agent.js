import { Annotation, StateGraph, START, END } from '@langchain/langgraph';
import { callGeminiJSON, callGemini } from '../services/gemini.service.js';

const FocusState = Annotation.Root({
  studentId: Annotation({ reducer: (a, b) => b ?? a, default: () => '' }),
  totalMinutes: Annotation({ reducer: (a, b) => b ?? a, default: () => 0 }),
  focusedMinutes: Annotation({ reducer: (a, b) => b ?? a, default: () => 0 }),
  distractions: Annotation({ reducer: (a, b) => b ?? a, default: () => [] }),
  environment: Annotation({ reducer: (a, b) => b ?? a, default: () => ({}) }),
  fingerprint: Annotation({ reducer: (a, b) => b ?? a, default: () => ({}) }),
  badges: Annotation({ reducer: (a, b) => b ?? a, default: () => [] }),
  focusScore: Annotation({ reducer: (a, b) => b ?? a, default: () => 0 })
});

async function aggregateNode(state) {
  const focusScore = state.totalMinutes > 0
    ? Math.round((state.focusedMinutes / state.totalMinutes) * 100)
    : 0;

  const distractionTypes = {};
  for (const d of state.distractions) {
    distractionTypes[d.type] = (distractionTypes[d.type] || 0) + 1;
  }

  return { focusScore, distractionTypes };
}

async function fingerprintNode(state) {
  try {
    const prompt = `Analyze this focus session data and generate a focus fingerprint:
- Total session: ${state.totalMinutes} minutes
- Focused time: ${state.focusedMinutes} minutes  
- Focus score: ${state.focusScore}%
- Distractions: ${JSON.stringify(state.distractions?.slice(0, 10))}
- Environment noise: ${state.environment?.noiseLevel || 'unknown'}

Return JSON:
{
  "bestHours": [list of recommended hours 0-23 for deep work based on session patterns],
  "avgDepth": number 0-100 representing focus depth,
  "triggers": ["list of main distraction triggers"],
  "sessionQuality": "deep|moderate|shallow",
  "recommendation": "personalized recommendation for better focus"
}`;

    const fingerprint = await callGeminiJSON(prompt);
    return { fingerprint };
  } catch (err) {
    console.error('Focus fingerprint AI failed, using heuristic fallback:', err.message);
    const quality = state.focusScore >= 80 ? 'deep' : state.focusScore >= 50 ? 'moderate' : 'shallow';
    const triggers = state.distractions?.slice(0, 5).map(d => d.type || 'unknown') || ['general'];
    const uniqueTriggers = [...new Set(triggers)];
    
    return {
      fingerprint: {
        bestHours: [9, 10, 11, 14, 15, 16],
        avgDepth: state.focusScore,
        triggers: uniqueTriggers.length > 0 ? uniqueTriggers : ['phone notifications', 'background noise'],
        sessionQuality: quality,
        recommendation: state.focusScore >= 80
          ? `Excellent focus session! You maintained ${state.focusScore}% focus over ${state.totalMinutes} minutes. Keep using this study environment for optimal results.`
          : state.focusScore >= 50
          ? `Good effort! You maintained ${state.focusScore}% focus. Try the Pomodoro technique (25 min focus + 5 min break) to push past the ${state.focusScore}% mark and reach deep focus consistently.`
          : `Your focus score of ${state.focusScore}% suggests frequent distractions. Try studying in a quieter space, using noise-cancelling headphones, and putting your phone on airplane mode during study sessions.`
      }
    };
  }
}

async function gamifyNode(state) {
  const badges = [];
  if (state.focusScore >= 90) badges.push('🧠 Deep Thinker');
  if (state.focusScore >= 80) badges.push('🎯 Laser Focus');
  if (state.focusedMinutes >= 60) badges.push('⏱️ Hour Power');
  if (state.focusedMinutes >= 120) badges.push('🔥 Marathon Mind');
  if (state.distractions?.length === 0) badges.push('🛡️ Distraction Shield');
  if (state.focusedMinutes >= 25) badges.push('🍅 Pomodoro Pro');
  return { badges };
}

const focusGuardianGraph = new StateGraph(FocusState)
  .addNode('aggregate', aggregateNode)
  .addNode('analyzeFingerprint', fingerprintNode)
  .addNode('gamify', gamifyNode)
  .addEdge(START, 'aggregate')
  .addEdge('aggregate', 'analyzeFingerprint')
  .addEdge('analyzeFingerprint', 'gamify')
  .addEdge('gamify', END);

export const runFocusGuardian = async (input) => {
  const compiled = focusGuardianGraph.compile();
  return await compiled.invoke(input);
};

export default focusGuardianGraph;
