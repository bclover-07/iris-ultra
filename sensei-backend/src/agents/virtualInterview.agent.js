import { Annotation, StateGraph, START, END } from '@langchain/langgraph';
import { callGeminiJSON, callGemini } from '../services/gemini.service.js';

const InterviewState = Annotation.Root({
  sessionId:           Annotation({ reducer: (a, b) => b ?? a, default: () => null }),
  userId:              Annotation({ reducer: (a, b) => b ?? a, default: () => null }),
  jobRole:             Annotation({ reducer: (a, b) => b ?? a, default: () => '' }),
  company:             Annotation({ reducer: (a, b) => b ?? a, default: () => '' }),
  mode:                Annotation({ reducer: (a, b) => b ?? a, default: () => 'hr' }),
  resumeData:          Annotation({ reducer: (a, b) => b ?? a, default: () => ({}) }),
  resumeAnalysis:      Annotation({ reducer: (a, b) => b ?? a, default: () => null }),
  conversationHistory: Annotation({ reducer: (a, b) => b ?? a, default: () => [] }),
  sessionScoreHistory: Annotation({ reducer: (a, b) => b ?? a, default: () => [] }),
  studentAnswer:       Annotation({ reducer: (a, b) => b ?? a, default: () => '' }),
  wordTimestamps:      Annotation({ reducer: (a, b) => b ?? a, default: () => [] }),
  mediaPipeData:       Annotation({ reducer: (a, b) => b ?? a, default: () => ({}) }),
  clientNLP:           Annotation({ reducer: (a, b) => b ?? a, default: () => ({}) }),
  audioMetrics:        Annotation({ reducer: (a, b) => b ?? a, default: () => ({}) }),
  currentQuestion:     Annotation({ reducer: (a, b) => b ?? a, default: () => null }),
  answerSentiment:     Annotation({ reducer: (a, b) => b ?? a, default: () => 0.5 }),
  answerEmotion:       Annotation({ reducer: (a, b) => b ?? a, default: () => 'neutral' }),
  keywordCoverage:     Annotation({ reducer: (a, b) => b ?? a, default: () => 0.5 }),
  missingConcepts:     Annotation({ reducer: (a, b) => b ?? a, default: () => [] }),
  grammarScore:        Annotation({ reducer: (a, b) => b ?? a, default: () => 0.5 }),
  fluencyScore:        Annotation({ reducer: (a, b) => b ?? a, default: () => 0.5 }),
  confidenceScore:     Annotation({ reducer: (a, b) => b ?? a, default: () => 0.5 }),
  technicalScore:      Annotation({ reducer: (a, b) => b ?? a, default: () => null }),
  technicalEval:       Annotation({ reducer: (a, b) => b ?? a, default: () => null }),
  answerQuality:       Annotation({ reducer: (a, b) => b ?? a, default: () => 'average' }),
  adaptiveDifficulty:  Annotation({ reducer: (a, b) => b ?? a, default: () => 1 }),
  reactionType:        Annotation({ reducer: (a, b) => b ?? a, default: () => 'neutral' }),
  reactionText:        Annotation({ reducer: (a, b) => b ?? a, default: () => '' }),
  nextQuestion:        Annotation({ reducer: (a, b) => b ?? a, default: () => null }),
  aiResponse:          Annotation({ reducer: (a, b) => b ?? a, default: () => '' }),
  feedbackNote:        Annotation({ reducer: (a, b) => b ?? a, default: () => null }),
  turnScores:          Annotation({ reducer: (a, b) => b ?? a, default: () => ({}) }),
  shouldEnd:           Annotation({ reducer: (a, b) => b ?? a, default: () => false }),
  finalReport:         Annotation({ reducer: (a, b) => b ?? a, default: () => null }),
  phase:               Annotation({ reducer: (a, b) => b ?? a, default: () => 'intro' }),
  questionIndex:       Annotation({ reducer: (a, b) => b ?? a, default: () => 0 }),
  totalQuestions:      Annotation({ reducer: (a, b) => b ?? a, default: () => 10 }),
  questionHistory:     Annotation({ reducer: (a, b) => b ?? a, default: () => [] }),
});

async function resumeContextLoader(state) {
  if (!state.resumeData || Object.keys(state.resumeData).length === 0) {
    return { resumeAnalysis: null };
  }
  try {
    const prompt = `Analyze this resume for a ${state.jobRole} role interview at ${state.company}.
Resume: ${JSON.stringify(state.resumeData).substring(0, 3000)}
Return JSON: {
  "topSkills": ["top 5 technical skills to probe"],
  "weakAreas": ["skills listed superficially"],
  "strongProjects": ["impressive projects to ask about"],
  "gaps": ["experience gaps for the target role"],
  "suggestedTopics": ["8 specific topics to cover in interview"]
}`;
    const analysis = await callGeminiJSON(prompt);
    return { resumeAnalysis: analysis };
  } catch (e) {
    return { resumeAnalysis: { topSkills: [], weakAreas: [], strongProjects: [], gaps: [], suggestedTopics: [] } };
  }
}

async function answerPreprocessor(state) {
  const text = state.studentAnswer || '';
  const wordCount = text.split(/\s+/).filter(Boolean).length;
  const duration = state.wordTimestamps?.length > 0
    ? state.wordTimestamps[state.wordTimestamps.length - 1].end || 30
    : 30;
  const wpm = duration > 0 ? Math.round((wordCount / duration) * 60) : 120;
  const fillers = ['um', 'uh', 'like', 'you know', 'basically', 'literally', 'so', 'okay', 'right'];
  let fillerCount = 0;
  const lowerText = text.toLowerCase();
  fillers.forEach(f => {
    const regex = new RegExp(`\\b${f}\\b`, 'g');
    const matches = lowerText.match(regex);
    if (matches) fillerCount += matches.length;
  });
  const pauseCount = (state.wordTimestamps || []).reduce((acc, w, i, arr) => {
    if (i === 0) return acc;
    return acc + ((w.start - arr[i - 1].end > 1.5) ? 1 : 0);
  }, 0);
  return {
    audioMetrics: {
      wpm, fillerCount, fillerRate: fillerCount / Math.max(wordCount, 1),
      pauseCount, wordCount, duration
    }
  };
}

async function nlpAnalyzer(state) {
  const sentiment = state.clientNLP?.sentiment || { label: 'POSITIVE', score: 0.5 };
  const emotion = state.clientNLP?.emotion || 'neutral';
  const clarity = state.clientNLP?.clarity || 0.5;
  const sentimentScore = sentiment.label === 'POSITIVE' ? sentiment.score : 1 - sentiment.score;
  const emotionPenalty = ['fear', 'sadness', 'anger'].includes(emotion) ? -0.1 : 0;
  return {
    answerSentiment: Math.max(0, Math.min(1, sentimentScore + emotionPenalty)),
    answerEmotion: emotion,
    grammarScore: clarity
  };
}

async function fluencyScorer(state) {
  const { wpm = 120, fillerRate = 0, pauseCount = 0, wordCount = 50 } = state.audioMetrics || {};
  let fluency = 1.0;
  if (wpm < 80) fluency -= 0.3;
  else if (wpm > 200) fluency -= 0.2;
  fluency -= Math.min(fillerRate * 2, 0.4);
  if (pauseCount > 5) fluency -= 0.1;
  if (wordCount < 30) fluency -= 0.3;
  if (wordCount > 300) fluency -= 0.1;
  return { fluencyScore: Math.max(0, Math.min(1, fluency)) };
}

async function keywordCoverageChecker(state) {
  const answer = state.studentAnswer || '';
  const expected = state.currentQuestion?.expectedKeywords || [];
  if (expected.length === 0) return { keywordCoverage: 0.5, missingConcepts: [] };
  try {
    const prompt = `Question expected keywords: ${expected.join(', ')}
Student answer: "${answer.substring(0, 500)}"
Rate coverage 0-1 (how well did the answer address the expected concepts)?
Return ONLY a JSON: { "coverage": number, "missingConcepts": ["string"] }`;
    const parsed = await callGeminiJSON(prompt);
    return { keywordCoverage: parsed.coverage || 0.5, missingConcepts: parsed.missingConcepts || [] };
  } catch (e) {
    const covered = expected.filter(k => answer.toLowerCase().includes(k.toLowerCase()));
    return { keywordCoverage: covered.length / expected.length, missingConcepts: expected.filter(k => !covered.includes(k)) };
  }
}

async function confidenceScorer(state) {
  const mp = state.mediaPipeData || {};
  const eyeWeight = 0.25;
  const postureWeight = 0.20;
  const sentimentWeight = 0.20;
  const fluencyWeight = 0.20;
  const expressionWeight = 0.15;
  const expressionScore = mp.expressionState === 'smile' ? 1.0 : mp.expressionState === 'stressed' ? 0.3 : 0.6;
  const confidence = (
    (mp.eyeContactScore || 0.5) * eyeWeight +
    (mp.postureScore || 0.5) * postureWeight +
    (state.answerSentiment || 0.5) * sentimentWeight +
    (state.fluencyScore || 0.5) * fluencyWeight +
    expressionScore * expressionWeight
  );
  return { confidenceScore: Math.max(0, Math.min(1, confidence)) };
}

async function technicalEvaluator(state) {
  const qType = state.currentQuestion?.type;
  if (!['technical', 'coding', 'system_design', 'dsa'].includes(qType)) {
    return { technicalScore: null, technicalEval: null };
  }
  try {
    const prompt = `You are a senior ${state.jobRole} at ${state.company} conducting a technical interview.
Question: "${state.currentQuestion?.text}"
Expected answer should cover: ${(state.currentQuestion?.expectedKeywords || []).join(', ')}
Student answered: "${(state.studentAnswer || '').substring(0, 800)}"

Evaluate technical accuracy and depth. Return JSON:
{
  "technicalScore": number (0-1),
  "correctConcepts": ["string"],
  "wrongConcepts": ["string"],
  "missedConcepts": ["string"],
  "depthRating": "surface"|"adequate"|"deep",
  "verdict": "one sentence"
}`;
    const ev = await callGeminiJSON(prompt);
    return { technicalScore: ev.technicalScore || 0.5, technicalEval: ev };
  } catch (e) {
    return { technicalScore: 0.5, technicalEval: null };
  }
}

async function adaptiveDifficultyAdjuster(state) {
  const currentD = state.adaptiveDifficulty || 1;
  const score = (
    (state.confidenceScore || 0.5) * 0.3 +
    (state.fluencyScore || 0.5) * 0.3 +
    (state.keywordCoverage || 0.5) * 0.2 +
    ((state.technicalScore ?? 0.5)) * 0.2
  );
  let newD = currentD;
  if (score > 0.75 && currentD < 3) newD = Math.min(3, currentD + 0.3);
  else if (score < 0.4 && currentD > 1) newD = Math.max(1, currentD - 0.3);
  return { adaptiveDifficulty: +newD.toFixed(1) };
}

async function reactionEvaluator(state) {
  const overallScore = (
    (state.confidenceScore || 0.5) * 0.35 +
    (state.fluencyScore || 0.5) * 0.25 +
    (state.keywordCoverage || 0.5) * 0.25 +
    ((state.technicalScore ?? 0.5)) * 0.15
  );
  const quality = overallScore > 0.75 ? 'excellent' : overallScore > 0.55 ? 'good' : overallScore > 0.35 ? 'average' : 'poor';
  const qualityMap = { excellent: 'positive', good: 'positive', average: 'neutral', poor: 'probing' };
  const reactionType = qualityMap[quality];
  return { answerQuality: quality, reactionType, overallScore };
}

async function reactionGenerator(state) {
  const modePersona = {
    hr: 'You are a warm, professional HR interviewer. Keep reactions brief (1-2 sentences).',
    technical: 'You are a serious technical interviewer. Be concise, occasionally probing.',
    stress: 'You are a stress interviewer. React skeptically, challenge answers.',
    mentor: 'You are a supportive mentor. Always encouraging, give hints if student struggled.',
    panel: 'You are part of a panel. React briefly (1 sentence max).'
  };

  try {
    const prompt = `${modePersona[state.mode] || modePersona.hr}
Company: ${state.company}. Role: ${state.jobRole}.
Student answered: "${(state.studentAnswer || '').substring(0, 300)}"
Answer quality: ${state.answerQuality}
Generate ONLY the interviewer's reaction (1-2 sentences max). Do NOT ask next question yet.
Reaction type: ${state.reactionType}`;
    const text = await callGemini(prompt);
    return { reactionText: text.trim() };
  } catch (e) {
    const fallbacks = {
      positive: "Good answer. Let's continue.",
      neutral: "I see. Let's move on.",
      probing: "Interesting. Let me ask you something different."
    };
    return { reactionText: fallbacks[state.reactionType] || fallbacks.neutral };
  }
}

async function phaseManager(state) {
  const idx = (state.questionIndex || 0) + 1;
  const total = state.totalQuestions || 10;
  let phase = state.phase;
  if (idx <= 1) phase = 'intro';
  else if (idx <= 3) phase = 'warmup';
  else if (idx <= Math.floor(total * 0.6)) phase = state.mode === 'technical' ? 'technical' : 'hr';
  else if (idx <= total - 1) phase = state.mode === 'hr' ? 'hr' : 'technical';
  else if (idx >= total) phase = 'closing';
  const shouldEnd = idx >= total;
  return { phase, questionIndex: idx, shouldEnd };
}

async function nextQuestionGenerator(state) {
  if (state.shouldEnd) return { nextQuestion: null };
  const coveredTopics = (state.questionHistory || []).filter(Boolean);
  const resumeCtx = state.resumeAnalysis ? `Resume insights: ${JSON.stringify(state.resumeAnalysis).substring(0, 500)}` : '';
  const diffLabel = state.adaptiveDifficulty <= 1.5 ? 'easy' : state.adaptiveDifficulty <= 2.5 ? 'medium' : 'hard';
  const questionTypes = {
    hr: ['behavioral', 'situational', 'motivation', 'culture_fit', 'communication'],
    technical: ['technical', 'coding', 'system_design', 'dsa', 'debugging'],
    stress: ['pressure', 'ambiguity', 'conflict', 'rapid_fire'],
    mentor: ['conceptual', 'guided', 'reflective'],
    panel: ['behavioral', 'technical', 'managerial']
  };
  const availableTypes = questionTypes[state.mode] || questionTypes.hr;

  try {
    const historyList = [];
    const rawHistory = state.conversationHistory || [];
    for (let i = 0; i < rawHistory.length; i++) {
      const item = rawHistory[i];
      if (item.role === 'question') {
        const next = rawHistory[i + 1];
        const answerText = (next && next.role === 'user') ? next.text : 'No answer provided.';
        historyList.push(`Q: ${item.text}\nA: ${answerText}`);
      }
    }
    const history = historyList.slice(-3).join('\n');

    const q = await callGeminiJSON(
      `You are conducting a ${state.mode} interview for ${state.jobRole} at ${state.company}.
Interview phase: ${state.phase}. Difficulty: ${diffLabel}.
${resumeCtx}
Recent Q&A:
${history}

Topics already covered: ${coveredTopics.join(', ') || 'none yet'}
Missing concepts from last answer: ${(state.missingConcepts || []).join(', ') || 'none'}
Last answer quality: ${state.answerQuality || 'unknown'}

Generate the next interview question. Return JSON ONLY:
{
  "text": "the question to ask",
  "type": "${availableTypes[0]}",
  "topic": "main concept being tested",
  "difficulty": "${diffLabel}",
  "expectedKeywords": ["5-8 key concepts a good answer should cover"],
  "followUp": false
}

Rules:
- DO NOT repeat covered topics
- Match the ${state.company} interview style
- Phase ${state.phase}: ${state.phase === 'intro' ? 'warm up question' : state.phase === 'technical' ? 'deep technical' : state.phase === 'hr' ? 'behavioral' : state.phase === 'closing' ? 'final reflective question' : 'standard question'}`
    );
    if (!q || !q.text) throw new Error("Missing question text in AI response");
    
    return { 
      nextQuestion: q,
      questionHistory: [...coveredTopics, q.topic]
    };
  } catch (e) {
    return {
      nextQuestion: {
        text: `Tell me about a challenge you faced in your experience as a ${state.jobRole}.`,
        type: availableTypes[0],
        topic: 'experience',
        difficulty: diffLabel,
        expectedKeywords: ['challenge', 'solution', 'outcome', 'teamwork', 'learning'],
        followUp: false
      }
    };
  }
}

async function responseAssembler(state) {
  if (state.shouldEnd) {
    return {
      aiResponse: `${state.reactionText} That concludes our interview. Thank you for your time. Please wait for your detailed feedback report.`
    };
  }
  const bridges = {
    positive: ['Moving on,', 'Great. Next,', 'Excellent. Let\'s explore', 'Good answer.'],
    neutral: ['Understood.', 'I see.', 'Alright.', 'Okay.'],
    probing: ['I\'d like to dig deeper.', 'Let\'s explore another angle.', 'Interesting perspective.'],
    encouraging: ['You\'re doing well.', 'Good effort.', 'Keep going.']
  };
  const bridgeArr = bridges[state.reactionType] || bridges.neutral;
  const bridge = bridgeArr[Math.floor(Math.random() * bridgeArr.length)];
  return {
    aiResponse: `${state.reactionText} ${bridge} ${state.nextQuestion?.text || ''}`
  };
}

async function scoresAccumulator(state) {
  return {
    turnScores: {
      technical: state.technicalScore,
      communication: ((state.answerSentiment || 0.5) + (state.grammarScore || 0.5)) / 2,
      confidence: state.confidenceScore,
      eyeContact: state.mediaPipeData?.eyeContactScore || 0.5,
      posture: state.mediaPipeData?.postureScore || 0.5,
      fluency: state.fluencyScore,
      sentiment: state.answerSentiment,
    }
  };
}

async function midInterviewFeedback(state) {
  const idx = state.questionIndex || 0;
  if (idx % 3 !== 0 || idx === 0) return { feedbackNote: null };
  const issues = [];
  if ((state.mediaPipeData?.eyeContactScore || 1) < 0.5) issues.push('Improve eye contact — look at the camera');
  if ((state.mediaPipeData?.postureScore || 1) < 0.5) issues.push('Sit up straight and look confident');
  if ((state.audioMetrics?.fillerRate || 0) > 0.1) issues.push('Reduce filler words (um, uh, like)');
  if ((state.audioMetrics?.wpm || 120) > 190) issues.push('Slow down your speaking pace');
  if ((state.audioMetrics?.wpm || 120) < 80) issues.push('Speak a bit faster and more confidently');
  if ((state.fluencyScore || 1) < 0.5) issues.push('Structure your answers: Situation → Action → Result');
  return { feedbackNote: issues.length > 0 ? issues[0] : null };
}

async function finalReportGenerator(state) {
  if (!state.shouldEnd) return { finalReport: null };
  const sessions = state.sessionScoreHistory || [];
  const avg = (key) => {
    const vals = sessions.map(t => t[key]).filter(v => v != null);
    return vals.length > 0 ? vals.reduce((s, v) => s + v, 0) / vals.length : 0;
  };
  const finalScores = {
    technical: avg('technical') || 0,
    communication: avg('communication'),
    confidence: avg('confidence'),
    eyeContact: avg('eyeContact'),
    posture: avg('posture'),
    fluency: avg('fluency'),
    overall: 0
  };
  const vals = Object.values(finalScores).filter(v => v > 0);
  finalScores.overall = vals.length > 0 ? vals.reduce((s, v) => s + v, 0) / vals.length : 0.5;

  try {
    const history = state.conversationHistory || [];
    const prompt = `You evaluated a ${state.mode} interview for ${state.jobRole} at ${state.company}.
Final Scores (0-1): ${JSON.stringify(finalScores)}
Recent Q&A: ${JSON.stringify(history.slice(-6)).substring(0, 1500)}

Generate a comprehensive interview report. Return JSON:
{
  "overallVerdict": "2-3 sentences summary",
  "strengths": ["3 specific strengths"],
  "improvements": ["3 specific areas to improve with actionable advice"],
  "weeklyActionPlan": [
    { "week": 1, "focus": "string", "tasks": ["string"], "resources": ["string"] },
    { "week": 2, "focus": "string", "tasks": ["string"], "resources": ["string"] },
    { "week": 3, "focus": "string", "tasks": ["string"], "resources": ["string"] },
    { "week": 4, "focus": "string", "tasks": ["string"], "resources": ["string"] }
  ],
  "readinessLevel": "not_ready"|"needs_work"|"almost_ready"|"ready",
  "companyFitScore": number (0-100),
  "recommendedRoles": ["3 alternative roles"],
  "keyLearningResources": [{ "title": "string", "url": "string", "type": "course"|"book"|"video"|"article" }]
}`;
    const report = await callGeminiJSON(prompt);
    return { finalReport: { ...report, scores: finalScores } };
  } catch (e) {
    return {
      finalReport: {
        scores: finalScores,
        overallVerdict: 'Interview completed. Review your scores for areas of improvement.',
        strengths: ['Completed the full interview'],
        improvements: ['Practice answering with more specific examples'],
        weeklyActionPlan: [{ week: 1, focus: 'Review fundamentals', tasks: ['Practice daily'], resources: [] }],
        readinessLevel: finalScores.overall > 0.7 ? 'almost_ready' : 'needs_work',
        companyFitScore: Math.round(finalScores.overall * 100),
        recommendedRoles: [state.jobRole],
        keyLearningResources: []
      }
    };
  }
}

function buildInterviewGraph() {
  const graph = new StateGraph(InterviewState)
    .addNode('answerPreprocessor', answerPreprocessor)
    .addNode('nlpAnalyzer', nlpAnalyzer)
    .addNode('fluencyScorer', fluencyScorer)
    .addNode('keywordCoverageChecker', keywordCoverageChecker)
    .addNode('confidenceScorer', confidenceScorer)
    .addNode('technicalEvaluator', technicalEvaluator)
    .addNode('adaptiveDifficultyAdjuster', adaptiveDifficultyAdjuster)
    .addNode('reactionEvaluator', reactionEvaluator)
    .addNode('reactionGenerator', reactionGenerator)
    .addNode('phaseManager', phaseManager)
    .addNode('nextQuestionGenerator', nextQuestionGenerator)
    .addNode('responseAssembler', responseAssembler)
    .addNode('scoresAccumulator', scoresAccumulator)
    .addNode('midInterviewFeedback', midInterviewFeedback)
    .addNode('finalReportGenerator', finalReportGenerator)
    .addEdge(START, 'answerPreprocessor')
    .addEdge('answerPreprocessor', 'nlpAnalyzer')
    .addEdge('nlpAnalyzer', 'fluencyScorer')
    .addEdge('fluencyScorer', 'keywordCoverageChecker')
    .addEdge('fluencyScorer', 'technicalEvaluator')
    .addEdge('fluencyScorer', 'confidenceScorer')
    .addEdge('keywordCoverageChecker', 'adaptiveDifficultyAdjuster')
    .addEdge('technicalEvaluator', 'adaptiveDifficultyAdjuster')
    .addEdge('confidenceScorer', 'adaptiveDifficultyAdjuster')
    .addEdge('adaptiveDifficultyAdjuster', 'reactionEvaluator')
    .addEdge('reactionEvaluator', 'reactionGenerator')
    .addEdge('reactionEvaluator', 'phaseManager')
    .addEdge('phaseManager', 'nextQuestionGenerator')
    .addEdge('reactionGenerator', 'responseAssembler')
    .addEdge('nextQuestionGenerator', 'responseAssembler')
    .addEdge('responseAssembler', 'scoresAccumulator')
    .addEdge('scoresAccumulator', 'midInterviewFeedback')
    .addConditionalEdges('midInterviewFeedback',
      (s) => s.shouldEnd ? 'end_branch' : 'continue',
      { end_branch: 'finalReportGenerator', continue: END }
    )
    .addEdge('finalReportGenerator', END);

  return graph.compile();
}

let compiledGraph = null;
export function getInterviewGraph() {
  if (!compiledGraph) {
    compiledGraph = buildInterviewGraph();
  }
  return compiledGraph;
}

export { resumeContextLoader };
export default { getInterviewGraph, resumeContextLoader };
