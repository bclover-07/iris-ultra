import { Annotation, StateGraph, START, END } from '@langchain/langgraph';
import { callGeminiJSON, callGemini } from '../services/gemini.service.js';
import { classifySentimentHF } from '../services/huggingface.service.js';

const DropoutState = Annotation.Root({
  students: Annotation({ reducer: (a, b) => b ?? a, default: () => [] }),
  predictions: Annotation({ reducer: (a, b) => b ?? a, default: () => [] })
});

async function sentimentNode(state) {
  const updated = await Promise.all(state.students.map(async (s) => {
    const textToAnalyze = `Tickets: ${JSON.stringify(s.helpTickets?.slice(0, 3) || [])}. Notes: ${s.wellnessNotes || 'none'}`;
    const hfSentimentScore = await classifySentimentHF(textToAnalyze);
    
    return { 
      ...s, 
      sentimentScore: hfSentimentScore, 
      sentimentSources: ['HuggingFace distilbert-sst-2 model'] 
    };
  }));
  return { students: updated };
}

async function behavioralNode(state) {
  const updated = state.students.map(s => ({
    ...s,
    attendanceVelocity: s.attendanceVelocity || 0,
    submissionDelays: s.submissionDelays || 0,
    behavioralFlags: s.behavioralFlags || []
  }));
  return { students: updated };
}

async function fusionNode(state) {
  const predictions = await Promise.all(state.students.map(async (s) => {
    let result;
    try {
      const prompt = `Calculate dropout risk for this student by fusing these signals:
- Sentiment score: ${s.sentimentScore}/100
- Attendance trend: ${s.attendanceVelocity}%
- Submission delays: ${s.submissionDelays} days avg
- CGPA: ${s.cgpa || 0}
- Help ticket frequency: ${s.helpFrequency || 0}

Return JSON: {
  "riskScore": number 0-100,
  "confidence": number 0-100,
  "riskTier": "low|medium|high|critical",
  "riskDrivers": [{"driver":"...","weight":number 0-1,"description":"..."}]
}`;
      result = await callGeminiJSON(prompt);
    } catch (e) {
      console.warn("AI Prediction failed, using fallback heuristic:", e.message);
      const baseRisk = (100 - s.attendanceVelocity) + (s.submissionDelays * 5) + ((10 - (s.cgpa || 5)) * 10);
      const riskScore = Math.min(100, Math.max(0, Math.round(baseRisk)));
      result = {
        riskScore,
        confidence: 85,
        riskTier: riskScore > 80 ? 'critical' : riskScore > 60 ? 'high' : riskScore > 40 ? 'medium' : 'low',
        riskDrivers: [
          { driver: "Attendance Velocity", weight: 0.4, description: `Attendance is at ${s.attendanceVelocity}%.` },
          { driver: "Academic Performance", weight: 0.4, description: `CGPA is ${s.cgpa}.` }
        ]
      };
    }
    return { studentId: s.studentId, name: s.name, ...result };
  }));
  return { predictions };
}

async function interventionNode(state) {
  const updated = await Promise.all(state.predictions.map(async (p) => {
    if (p.riskScore > 40) {
      let message = "Please schedule a meeting with your academic advisor. We noticed you might be struggling and want to help.";
      try {
        const prompt = `Draft a personalized intervention message for a student at ${p.riskTier} dropout risk.
Risk drivers: ${JSON.stringify(p.riskDrivers?.slice(0, 3))}
Be empathetic, specific, and actionable. 2-3 sentences max.`;
        message = await callGemini(prompt);
      } catch (e) {
        console.warn("AI Intervention gen failed, using fallback:", e.message);
      }
      return { ...p, intervention: { message, type: 'email', effectiveness: 0, sent: false } };
    } else {
      return { ...p, intervention: { message: '', type: 'email', sent: false } };
    }
  }));
  return { predictions: updated };
}

function routeBasedOnRisk(state) {

  const hasAtRiskStudents = state.predictions.some(p => p.riskScore > 40);
  if (hasAtRiskStudents) {
    return 'intervention';
  }
  return END;
}

const dropoutGraph = new StateGraph(DropoutState)
  .addNode('sentiment', sentimentNode)
  .addNode('behavioral', behavioralNode)
  .addNode('fusion', fusionNode)
  .addNode('intervention', interventionNode)
  .addEdge(START, 'sentiment')
  .addEdge('sentiment', 'behavioral')
  .addEdge('behavioral', 'fusion')
  .addConditionalEdges('fusion', routeBasedOnRisk, {
    'intervention': 'intervention',
    [END]: END
  })
  .addEdge('intervention', END);

export const runDropoutPrediction = async (input) => {
  const compiled = dropoutGraph.compile();
  return await compiled.invoke(input);
};

export default dropoutGraph;
