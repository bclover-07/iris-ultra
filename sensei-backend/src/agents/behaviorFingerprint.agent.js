import { Annotation, StateGraph, START, END } from '@langchain/langgraph';
import { callGeminiJSON } from '../services/gemini.service.js';
import { generateEmbeddingsHF } from '../services/huggingface.service.js';

const BehaviorState = Annotation.Root({
  classId: Annotation({ reducer: (a, b) => b ?? a, default: () => '' }),
  students: Annotation({ reducer: (a, b) => b ?? a, default: () => [] }),
  language: Annotation({ reducer: (a, b) => b ?? a, default: () => 'en' }),
  clusters: Annotation({ reducer: (a, b) => b ?? a, default: () => [] }),
  correlations: Annotation({ reducer: (a, b) => b ?? a, default: () => [] }),
  alerts: Annotation({ reducer: (a, b) => b ?? a, default: () => [] })
});

async function aggregateNode(state) {
  return { students: state.students };
}

const cosineSimilarity = (vecA, vecB) => {
  if (!vecA || !vecB || vecA.length !== vecB.length || vecA.length === 0) return 0;
  let dotProduct = 0, normA = 0, normB = 0;
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
};

async function clusteringNode(state) {
  try {
    const embeddedStudents = await Promise.all(state.students.map(async (s) => {
      const profileText = `Attendance: ${s.signals?.attendancePattern || 0}%, Quizzes: ${s.signals?.quizVelocity || 0}, Wellness: ${s.signals?.wellnessScore || 50}, Help: ${s.signals?.helpFrequency || 0}, Study: ${s.signals?.studyDuration || 0}m, Risk: ${s.riskLevel || 'low'}`;
      let embedding;
      try {
        embedding = await generateEmbeddingsHF(profileText);
      } catch (embErr) {
        embedding = new Array(384).fill(0);
      }
      return { ...s, profileText, embedding };
    }));

    const clusters = [];
    const visited = new Set();
    
    for (let i = 0; i < embeddedStudents.length; i++) {
      if (visited.has(i)) continue;
      
      const currentCluster = [embeddedStudents[i]];
      visited.add(i);
      
      for (let j = i + 1; j < embeddedStudents.length; j++) {
        if (visited.has(j)) continue;
        const sim = cosineSimilarity(embeddedStudents[i].embedding, embeddedStudents[j].embedding);
        if (sim > 0.85) {
          currentCluster.push(embeddedStudents[j]);
          visited.add(j);
        }
      }
      
      clusters.push({
        clusterId: `Group_${clusters.length + 1}`,
        size: currentCluster.length,
        members: currentCluster.map(c => c.name),
        representativeProfile: currentCluster[0].profileText
      });
    }
    
    return { clusters };
  } catch (err) {
    console.error('Clustering failed, creating single-student clusters:', err.message);
    const clusters = state.students.map((s, i) => ({
      clusterId: `Group_${i + 1}`,
      size: 1,
      members: [s.name],
      representativeProfile: `Attendance: ${s.signals?.attendancePattern || 0}%, Risk: ${s.riskLevel || 'low'}`
    }));
    return { clusters };
  }
}

async function correlateNode(state) {
  try {
    const prompt = `Analyze these mathematically clustered student behavior groups for hidden correlations and pedagogical recommendations:
${JSON.stringify(state.clusters)}
Return JSON: { "correlations": [{"pattern":"...","affectedCount":0,"impactDescription":"...","severity":"info|warning|critical","pedagogyRecommendation":"Actionable plain-English teaching strategy recommendation for this cluster"}], "alerts": [{"message":"...","matchedStudents":["names"],"severity":"warning","actionSuggestion":"..."}] }

IMPORTANT TRANSLATION INSTRUCTION:
Generate ALL human-readable string values (like pattern, impactDescription, pedagogyRecommendation, message, actionSuggestion) translated completely into the following language code: "${state.language}".`;

    const result = await callGeminiJSON(prompt);
    return { correlations: result.correlations || [], alerts: result.alerts || [] };
  } catch (err) {
    console.error('Correlation AI failed, using rule-based fallback:', err.message);
    const correlations = [];
    const alerts = [];
    
    for (const cluster of state.clusters) {
      if (cluster.representativeProfile.includes('Risk: high') || cluster.representativeProfile.includes('Risk: critical')) {
        correlations.push({
          pattern: `High-risk student cluster detected (${cluster.members.length} students)`,
          affectedCount: cluster.members.length,
          impactDescription: 'These students share similar risk profiles and may benefit from targeted group intervention.',
          severity: 'warning',
          pedagogyRecommendation: 'Schedule weekly check-in sessions with this group. Provide additional office hours and consider peer mentoring programs.'
        });
        alerts.push({
          message: `${cluster.members.length} students in ${cluster.clusterId} show concerning behavioral patterns`,
          matchedStudents: cluster.members,
          severity: 'warning',
          actionSuggestion: 'Review individual student profiles and schedule intervention meetings this week.'
        });
      }
    }
    
    if (correlations.length === 0) {
      correlations.push({
        pattern: 'Normal behavioral distribution across student groups',
        affectedCount: state.students.length,
        impactDescription: 'Students show varied but generally healthy academic engagement patterns.',
        severity: 'info',
        pedagogyRecommendation: 'Continue current teaching strategies. Consider introducing differentiated assignments to challenge advanced students.'
      });
    }
    
    return { correlations, alerts };
  }
}

async function alertNode(state) {
  return { correlations: state.correlations, alerts: state.alerts };
}

const behaviorGraph = new StateGraph(BehaviorState)
  .addNode('aggregate', aggregateNode)
  .addNode('cluster', clusteringNode)
  .addNode('correlate', correlateNode)
  .addNode('alert', alertNode)
  .addEdge(START, 'aggregate')
  .addEdge('aggregate', 'cluster')
  .addEdge('cluster', 'correlate')
  .addEdge('correlate', 'alert')
  .addEdge('alert', END);

export const runBehaviorFingerprint = async (input) => {
  const compiled = behaviorGraph.compile();
  return await compiled.invoke(input);
};

export default behaviorGraph;
