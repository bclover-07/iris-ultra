import { Annotation, StateGraph, START, END } from '@langchain/langgraph';
import { callGeminiJSON, callGemini } from '../services/gemini.service.js';

const DebateState = Annotation.Root({
  sessionId:            Annotation({ reducer: (a, b) => b ?? a, default: () => null }),
  userId:               Annotation({ reducer: (a, b) => b ?? a, default: () => null }),
  topic:                Annotation({ reducer: (a, b) => b ?? a, default: () => '' }),
  aiPersonality:        Annotation({ reducer: (a, b) => b ?? a, default: () => 'calm_professor' }),
  debateMode:           Annotation({ reducer: (a, b) => b ?? a, default: () => 'standard' }),
  round:                Annotation({ reducer: (a, b) => b ?? a, default: () => 0 }),
  totalRounds:          Annotation({ reducer: (a, b) => b ?? a, default: () => 6 }),
  phase:                Annotation({ reducer: (a, b) => b ?? a, default: () => 'opening' }),
  shouldEnd:            Annotation({ reducer: (a, b) => b ?? a, default: () => false }),
  startedAt:            Annotation({ reducer: (a, b) => b ?? a, default: () => Date.now() }),
  studentArgument:      Annotation({ reducer: (a, b) => b ?? a, default: () => '' }),
  processedArgument:    Annotation({ reducer: (a, b) => b ?? a, default: () => '' }),
  wordCount:            Annotation({ reducer: (a, b) => b ?? a, default: () => 0 }),
  fillerCount:          Annotation({ reducer: (a, b) => b ?? a, default: () => 0 }),
  wpm:                  Annotation({ reducer: (a, b) => b ?? a, default: () => 120 }),
  audioMetrics:         Annotation({ reducer: (a, b) => b ?? a, default: () => ({}) }),
  mediaPipeData:        Annotation({ reducer: (a, b) => b ?? a, default: () => ({}) }),
  clientNLP:            Annotation({ reducer: (a, b) => b ?? a, default: () => ({}) }),
  currentThrows:        Annotation({ reducer: (a, b) => b ?? a, default: () => [] }),
  fallaciesDetected:    Annotation({ reducer: (a, b) => b ?? a, default: () => [] }),
  currentFallacy:       Annotation({ reducer: (a, b) => b ?? a, default: () => null }),
  currentEmotionalState:Annotation({ reducer: (a, b) => b ?? a, default: () => 'calm' }),
  frustrationScore:     Annotation({ reducer: (a, b) => b ?? a, default: () => 0.3 }),
  emotionTimeline:      Annotation({ reducer: (a, b) => b ?? a, default: () => [] }),
  logicScore:           Annotation({ reducer: (a, b) => b ?? a, default: () => 0.5 }),
  logicEval:            Annotation({ reducer: (a, b) => b ?? a, default: () => ({}) }),
  logicScores:          Annotation({ reducer: (a, b) => b ?? a, default: () => [] }),
  persuasionScore:      Annotation({ reducer: (a, b) => b ?? a, default: () => 0.5 }),
  crowdMood:            Annotation({ reducer: (a, b) => b ?? a, default: () => 50 }),
  crowdReaction:        Annotation({ reducer: (a, b) => b ?? a, default: () => 'neutral' }),
  heatLevel:            Annotation({ reducer: (a, b) => b ?? a, default: () => 1 }),
  heatLevelDisplay:     Annotation({ reducer: (a, b) => b ?? a, default: () => 1 }),
  throwableEvents:      Annotation({ reducer: (a, b) => b ?? a, default: () => [] }),
  aiThrowReaction:      Annotation({ reducer: (a, b) => b ?? a, default: () => 'ignore' }),
  aiResponseText:       Annotation({ reducer: (a, b) => b ?? a, default: () => '' }),
  aiIsInterrupt:        Annotation({ reducer: (a, b) => b ?? a, default: () => false }),
  aiEmotionDisplay:     Annotation({ reducer: (a, b) => b ?? a, default: () => 'calm' }),
  aiGestureHint:        Annotation({ reducer: (a, b) => b ?? a, default: () => 'none' }),
  shouldCutStudentMic:  Annotation({ reducer: (a, b) => b ?? a, default: () => false }),
  micCutDuration:       Annotation({ reducer: (a, b) => b ?? a, default: () => 0 }),
  interruptEvent:       Annotation({ reducer: (a, b) => b ?? a, default: () => null }),
  scores:               Annotation({ reducer: (a, b) => b ?? a, default: () => ({}) }),
  scoreTurns:           Annotation({ reducer: (a, b) => b ?? a, default: () => 0 }),
  coachingNudge:        Annotation({ reducer: (a, b) => b ?? a, default: () => null }),
  conversationHistory:  Annotation({ reducer: (a, b) => b ?? a, default: () => [] }),
  frontendPayload:      Annotation({ reducer: (a, b) => b ?? a, default: () => ({}) }),
  psychologicalBreakdown: Annotation({ reducer: (a, b) => b ?? a, default: () => null }),
  sessionXPEarned:      Annotation({ reducer: (a, b) => b ?? a, default: () => 0 }),
  side:                 Annotation({ reducer: (a, b) => b ?? a, default: () => 'pro' }),
});


async function argumentPreprocessor(state) {
  const text = state.studentArgument || '';
  const wordCount = text.split(/\s+/).filter(Boolean).length;
  const fillers = ['um','uh','like','you know','basically','literally'];
  const fillerCount = fillers.reduce((a, f) => {
    const regex = new RegExp('\\b' + f + '\\b', 'gi');
    return a + (text.match(regex) || []).length;
  }, 0);
  return { processedArgument: text.trim(), wordCount, fillerCount, wpm: state.audioMetrics?.wpm || 120 };
}


async function fallacyDetector(state) {
  try {
    const result = await callGeminiJSON(
      'Analyze this debate argument for logical fallacies:\nTopic: "' + state.topic + '"\nStudent argued: "' + state.processedArgument + '"\n\n' +
      'Detect: ad_hominem, strawman, false_dichotomy, slippery_slope, appeal_to_emotion, hasty_generalization, circular_reasoning, red_herring, appeal_to_authority, whataboutism\n\n' +
      'Return JSON: { "fallaciesFound": [{ "type": "string", "excerpt": "string", "explanation": "string (max 15 words)", "severity": "minor"|"moderate"|"major" }], "hasFallacy": boolean }'
    );
    const detected = result.fallaciesFound || [];
    return { fallaciesDetected: [...(state.fallaciesDetected || []), ...detected], currentFallacy: detected[0] || null };
  } catch (e) {
    return { currentFallacy: null };
  }
}


async function emotionalStateAnalyzer(state) {
  const mp = state.mediaPipeData || {};
  const nlp = state.clientNLP || {};
  const frustration = (mp.frustrationScore || 0.3) * 0.35 + (1 - (mp.confidenceScore || 0.7)) * 0.25 + (mp.aggressionScore || 0.2) * 0.2 + (nlp.toxicityScore || 0) * 0.2;
  const emotionalState = frustration > 0.7 ? 'highly_frustrated' : frustration > 0.5 ? 'frustrated' : frustration > 0.3 ? 'tense' : 'calm';
  const entry = { time: Date.now() - state.startedAt, frustration: +frustration.toFixed(2), confidence: mp.confidenceScore || 0.7, aggression: mp.aggressionScore || 0.2, expression: mp.expressionState || 'neutral', emotionalState };
  return { currentEmotionalState: emotionalState, frustrationScore: frustration, emotionTimeline: [...(state.emotionTimeline || []), entry] };
}


async function logicEvaluator(state) {
  try {
    const ev = await callGeminiJSON(
      'Debate topic: "' + state.topic + '"\nCurrent argument: "' + state.processedArgument + '"\n\n' +
      'Evaluate logical quality. Return JSON: { "logicScore": number(0-1), "topicRelevance": number(0-1), "argumentStrength": "weak"|"moderate"|"strong", "keyPoints": ["string"] }'
    );
    return { logicScore: ev.logicScore || 0.5, logicEval: ev };
  } catch (e) {
    return { logicScore: 0.5, logicEval: {} };
  }
}


async function persuasionScorer(state) {
  const p = (state.logicScore || 0.5) * 0.4 + (state.clientNLP?.sentiment?.score || 0.5) * 0.2 + (1 - (state.fillerCount / Math.max(state.wordCount, 1)) * 5) * 0.2 + (state.mediaPipeData?.confidenceScore || 0.5) * 0.2;
  return { persuasionScore: Math.max(0, Math.min(1, p)) };
}


async function crowdMoodUpdater(state) {
  let mood = state.crowdMood || 50;
  if (state.logicScore > 0.75) mood += 10; else if (state.logicScore < 0.35) mood -= 12;
  if (state.persuasionScore > 0.7) mood += 8;
  if (state.currentFallacy?.severity === 'major') mood -= 15;
  if (state.currentEmotionalState === 'highly_frustrated') mood -= 10;
  mood = Math.max(0, Math.min(100, mood));
  return { crowdMood: mood, crowdReaction: mood > 75 ? 'cheer' : mood > 55 ? 'neutral' : mood < 30 ? 'boo' : 'quiet' };
}


async function heatLevelEscalator(state) {
  let heat = state.heatLevel || 1;
  const avg = (state.logicScores || []).reduce((a, b) => a + b, 0) / Math.max((state.logicScores || []).length, 1);
  if (avg > 0.7 && state.round > 2) heat = Math.min(5, heat + 0.5);
  if (avg < 0.4) heat = Math.max(1, heat - 0.3);
  if (state.currentEmotionalState === 'calm' && state.round > 3) heat = Math.min(5, heat + 0.3);
  return { heatLevel: +heat.toFixed(1), heatLevelDisplay: Math.round(heat) };
}


async function throwEventHandler(state) {
  const throws = state.currentThrows || [];
  if (throws.length === 0) return {};
  const log = throws.map(t => ({ item: t.item, hit: t.hit, timestamp: t.timestamp, emotionalContext: state.currentEmotionalState, note: state.currentEmotionalState === 'frustrated' ? 'threw_when_frustrated' : state.currentEmotionalState === 'calm' ? 'threw_for_fun' : 'threw_when_tense' }));
  return { throwableEvents: [...(state.throwableEvents || []), ...log], aiThrowReaction: throws[0]?.hit ? 'retaliate_verbal' : 'ignore' };
}


async function aiPersonalityResponseGenerator(state) {
  const personas = {
    aggressive_politician: 'You are an aggressive political debater. Interrupt, challenge everything, use rhetorical questions. Heat ' + state.heatLevel + '/5.',
    calm_professor: 'You are a logical academic. Use evidence, ask Socratic questions, destroy arguments with logic. Heat ' + state.heatLevel + '/5.',
    troll_debater: 'You are a troll debater. Use emotional bait, mockery. Heat ' + state.heatLevel + '/5.',
    fast_thinker: 'You are rapid-fire. SHORT punchy responses (max 40 words). Heat ' + state.heatLevel + '/5.',
    passive_opponent: 'You are passive. Short vague answers (max 20 words). At heat 3+: point out contradictions.',
    news_anchor: 'You are a formal news anchor. Redirect off-topic answers professionally. Heat ' + state.heatLevel + '/5.',
    startup_investor: 'You are a skeptical investor. Challenge evidence. Heat ' + state.heatLevel + '/5.',
    toxic_opponent: 'You are toxic. Provoke frustration, dismiss, mock. Heat ' + state.heatLevel + '/5.'
  };
  const shouldInterrupt = ['aggressive_politician', 'fast_thinker', 'toxic_opponent'].includes(state.aiPersonality) && state.heatLevel >= 3 && Math.random() > 0.5;
  try {
    const history = (state.conversationHistory || []).slice(-3).map(h => {
      const studentText = h.student?.text || h.studentText || '';
      const aiText = h.ai?.text || h.aiText || '';
      return `Student: ${studentText}\nAI: ${aiText}`;
    }).join('\n');

    const studentStanceText = state.side === 'con' ? 'CON (opposing the topic)' : 'PRO (supporting the topic)';
    const aiStanceText = state.side === 'con' ? 'PRO (supporting the topic)' : 'CON (opposing the topic)';

    const ai = await callGeminiJSON(
      (personas[state.aiPersonality] || personas.calm_professor) + '\n' +
      'You must argue the ' + aiStanceText + ' stance. The student is arguing the ' + studentStanceText + ' stance.\n' +
      'Topic: "' + state.topic + '". Round ' + state.round + '/' + state.totalRounds + '. Phase: ' + state.phase + '.\n' +
      'Recent History:\n' + history + '\n\n' +
      'Student just argued: "' + (state.processedArgument || '').substring(0, 400) + '"\n' +
      'Emotional state: ' + state.currentEmotionalState + '. Crowd: ' + state.crowdMood + '/100.\n' +
      (state.currentFallacy ? 'Student made fallacy (' + state.currentFallacy.type + ').\n' : '') +
      (state.aiThrowReaction === 'retaliate_verbal' ? 'Student threw something at you.\n' : '') +
      (shouldInterrupt ? 'START with "[INTERRUPT]".\n' : '') +
      'Generate debate response (max 120 words). Return JSON: { "text": "string", "isInterrupt": boolean, "emotionDisplayed": "calm"|"aggressive"|"amused"|"dismissive"|"passionate", "gestureHint": "point"|"shrug"|"laugh"|"lean_forward"|"arms_crossed"|"none" }'
    );
    return { aiResponseText: ai.text, aiIsInterrupt: ai.isInterrupt || false, aiEmotionDisplay: ai.emotionDisplayed || 'calm', aiGestureHint: ai.gestureHint || 'none' };
  } catch (e) {
    return { aiResponseText: 'I disagree with your position.', aiIsInterrupt: false, aiEmotionDisplay: 'calm', aiGestureHint: 'none' };
  }
}


async function interruptHandler(state) {
  if (!state.aiIsInterrupt) return {};
  return { interruptEvent: { timestamp: Date.now(), frustrationBefore: state.frustrationScore }, shouldCutStudentMic: true, micCutDuration: 3000 };
}


async function phaseManager(state) {
  const round = (state.round || 0) + 1;
  const total = state.totalRounds || 6;
  let phase = 'opening';
  if (round > 1 && round <= Math.floor(total * 0.4)) phase = 'rebuttal';
  else if (round > Math.floor(total * 0.4) && round <= Math.floor(total * 0.7)) phase = 'cross_examination';
  else if (round > Math.floor(total * 0.7) && round < total) phase = 'closing';
  else if (round >= total) phase = 'final';
  return { round, phase, shouldEnd: round >= total };
}


async function runningScoresUpdater(state) {
  const t = (state.scoreTurns || 0) + 1;
  const p = state.scores || {};
  const s = {
    logic: ((p.logic || 0) * (t - 1) + (state.logicScore || 0.5)) / t,
    confidence: ((p.confidence || 0) * (t - 1) + (state.mediaPipeData?.confidenceScore || 0.5)) / t,
    clarity: ((p.clarity || 0) * (t - 1) + (1 - Math.min((state.fillerCount || 0) / Math.max(state.wordCount || 1, 1) * 10, 1))) / t,
    emotionalControl: ((p.emotionalControl || 0) * (t - 1) + (1 - (state.frustrationScore || 0.7))) / t,
    persuasion: ((p.persuasion || 0) * (t - 1) + (state.persuasionScore || 0.5)) / t,
    diplomacy: ((p.diplomacy || 0) * (t - 1) + (state.currentFallacy ? 0.3 : 0.8)) / t,
    overall: 0
  };
  s.overall = Object.entries(s).filter(([k]) => k !== 'overall').reduce((sum, [, v]) => sum + v, 0) / 6;
  return { scores: s, scoreTurns: t };
}


async function midDebateCoaching(state) {
  if ((state.round || 0) % 2 !== 0 || state.round === 0) return { coachingNudge: null };
  const issues = [];
  if (state.frustrationScore > 0.6) issues.push('Pause, breathe, then respond');
  if ((state.fillerCount || 0) / (state.wordCount || 1) > 0.1) issues.push('Reduce filler words');
  if (state.currentFallacy?.type === 'ad_hominem') issues.push('Attack the argument, not the person');
  if ((state.logicEval?.topicRelevance || 1) < 0.5) issues.push('Stay on topic');
  return { coachingNudge: issues[0] || null };
}


async function responseAssembler(state) {
  return {
    frontendPayload: {
      aiText: state.aiResponseText, aiEmotion: state.aiEmotionDisplay, aiGesture: state.aiGestureHint,
      isInterrupt: state.aiIsInterrupt, shouldCutMic: state.shouldCutStudentMic || false, micCutDuration: state.micCutDuration || 0,
      crowdMood: state.crowdMood, crowdReaction: state.crowdReaction, heatLevel: state.heatLevelDisplay || 1,
      coachingNudge: state.coachingNudge, fallacyAlert: state.currentFallacy,
      round: state.round, phase: state.phase, totalRounds: state.totalRounds, scores: state.scores, shouldEnd: state.shouldEnd
    }
  };
}


async function conversationHistoryLogger(state) {
  const entry = {
    round: state.round, phase: state.phase, timestamp: Date.now(),
    student: { text: state.processedArgument, logicScore: state.logicScore, emotionalState: state.currentEmotionalState, fallacy: state.currentFallacy?.type || null },
    ai: { text: state.aiResponseText, emotion: state.aiEmotionDisplay, interrupted: state.aiIsInterrupt }
  };
  return { conversationHistory: [...(state.conversationHistory || []), entry] };
}


async function psychologicalBreakdownGenerator(state) {
  if (!state.shouldEnd) return {};
  const timeline = state.emotionTimeline || [];
  const fallacies = state.fallaciesDetected || [];
  const throws = state.throwableEvents || [];
  const peaks = timeline.filter(e => e.frustration > 0.7).length;
  const throwFrust = throws.filter(t => t.note === 'threw_when_frustrated').length;
  const throwFun = throws.filter(t => t.note === 'threw_for_fun').length;
  const avgConf = (timeline.reduce((a, e) => a + e.confidence, 0) / Math.max(timeline.length, 1)).toFixed(2);

  try {
    const psych = await callGeminiJSON(
      'You are an expert debate coach analyzing a student.\nTopic: "' + state.topic + '". AI: ' + state.aiPersonality + '. Rounds: ' + state.totalRounds + '.\n' +
      'Scores: ' + JSON.stringify(state.scores) + '\nFallacies: ' + JSON.stringify(fallacies.map(f => f.type)) + '\n' +
      'Frustration peaks: ' + peaks + '. Throws frustrated: ' + throwFrust + ', fun: ' + throwFun + '. Avg confidence: ' + avgConf + '.\n\n' +
      'Return JSON: { "overallVerdict": "string", "psychologicalProfile": { "debatingStyle": "string", "underPressure": "string", "strengthsUnderPressure": ["string"], "vulnerabilitiesUnderPressure": ["string"] }, "frustrationAnalysis": { "triggerPoints": ["string"], "pattern": "string", "recoveryAbility": "poor"|"average"|"good"|"excellent" }, "confidenceAnalysis": { "dropMoments": ["string"], "peakMoments": ["string"], "overallArc": "declining"|"stable"|"improving"|"volatile" }, "logicWeaknesses": { "recurringFallacies": ["string"], "logicBreakdownMoments": ["string"], "improvementFocus": "string" }, "emotionalManipulationDetected": { "wasManipulated": boolean, "manipulationTechniquesUsed": ["string"], "studentResponse": "string", "resistanceScore": number }, "throwingBehavior": { "interpretation": "string", "signal": "string" }, "strengths": ["string"], "improvements": ["string"], "weeklyTrainingPlan": [{ "week": 1, "focus": "string", "drills": ["string"], "mentalExercises": ["string"] }, { "week": 2, "focus": "string", "drills": ["string"], "mentalExercises": ["string"] }, { "week": 3, "focus": "string", "drills": ["string"], "mentalExercises": ["string"] }], "debateRank": "string", "xpEarned": number }'
    );
    return { psychologicalBreakdown: psych, sessionXPEarned: psych.xpEarned || 100 };
  } catch (e) {
    return { psychologicalBreakdown: { overallVerdict: 'Analysis unavailable', debateRank: 'Unranked', xpEarned: 50 }, sessionXPEarned: 50 };
  }
}


function buildDebateGraph() {
  const graph = new StateGraph(DebateState)
    .addNode('argumentPreprocessor', argumentPreprocessor)
    .addNode('fallacyDetector', fallacyDetector)
    .addNode('emotionalStateAnalyzer', emotionalStateAnalyzer)
    .addNode('logicEvaluator', logicEvaluator)
    .addNode('persuasionScorer', persuasionScorer)
    .addNode('crowdMoodUpdater', crowdMoodUpdater)
    .addNode('heatLevelEscalator', heatLevelEscalator)
    .addNode('throwEventHandler', throwEventHandler)
    .addNode('aiPersonalityResponseGenerator', aiPersonalityResponseGenerator)
    .addNode('interruptHandler', interruptHandler)
    .addNode('phaseManager', phaseManager)
    .addNode('runningScoresUpdater', runningScoresUpdater)
    .addNode('midDebateCoaching', midDebateCoaching)
    .addNode('responseAssembler', responseAssembler)
    .addNode('conversationHistoryLogger', conversationHistoryLogger)
    .addNode('psychologicalBreakdownGenerator', psychologicalBreakdownGenerator)
    .addEdge(START, 'argumentPreprocessor')
    .addEdge('argumentPreprocessor', 'fallacyDetector')
    .addEdge('argumentPreprocessor', 'logicEvaluator')
    .addEdge('argumentPreprocessor', 'emotionalStateAnalyzer')
    .addEdge('argumentPreprocessor', 'throwEventHandler')
    .addEdge('fallacyDetector', 'persuasionScorer')
    .addEdge('logicEvaluator', 'persuasionScorer')
    .addEdge('emotionalStateAnalyzer', 'persuasionScorer')
    .addEdge('throwEventHandler', 'persuasionScorer')
    .addEdge('persuasionScorer', 'crowdMoodUpdater')
    .addEdge('crowdMoodUpdater', 'heatLevelEscalator')
    .addEdge('heatLevelEscalator', 'phaseManager')
    .addEdge('phaseManager', 'runningScoresUpdater')
    .addEdge('runningScoresUpdater', 'midDebateCoaching')
    .addEdge('midDebateCoaching', 'aiPersonalityResponseGenerator')
    .addEdge('aiPersonalityResponseGenerator', 'interruptHandler')
    .addEdge('interruptHandler', 'responseAssembler')
    .addEdge('responseAssembler', 'conversationHistoryLogger')
    .addConditionalEdges('conversationHistoryLogger',
      (s) => s.shouldEnd ? 'end_branch' : 'continue',
      { end_branch: 'psychologicalBreakdownGenerator', continue: END }
    )
    .addEdge('psychologicalBreakdownGenerator', END);

  return graph.compile();
}

let compiledGraph = null;
export function getDebateGraph() {
  if (!compiledGraph) compiledGraph = buildDebateGraph();
  return compiledGraph;
}

export default { getDebateGraph };
