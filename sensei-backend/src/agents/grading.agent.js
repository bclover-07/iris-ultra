import { Annotation, StateGraph, START, END } from '@langchain/langgraph';
import { callGeminiJSON, callGemini } from '../services/gemini.service.js';

const GradingState = Annotation.Root({
  brief: Annotation({ reducer: (a, b) => b ?? a, default: () => '' }),
  subject: Annotation({ reducer: (a, b) => b ?? a, default: () => '' }),
  rubric: Annotation({ reducer: (a, b) => b ?? a, default: () => ({}) }),
  submissions: Annotation({ reducer: (a, b) => b ?? a, default: () => [] }),
  results: Annotation({ reducer: (a, b) => b ?? a, default: () => [] })
});

async function rubricNode(state) {
  const prompt = `Generate a detailed grading rubric for this assignment:
Brief: "${state.brief}"
Subject: ${state.subject || 'General'}

Return JSON:
{
  "criteria": [
    {
      "name": "Criterion name",
      "maxPoints": 25,
      "description": "What this criterion evaluates",
      "levels": [
        { "label": "Excellent", "points": 25, "descriptor": "..." },
        { "label": "Good", "points": 20, "descriptor": "..." },
        { "label": "Average", "points": 15, "descriptor": "..." },
        { "label": "Poor", "points": 5, "descriptor": "..." }
      ]
    }
  ],
  "totalPoints": 100
}

Create 4 meaningful criteria that total 100 points.`;

  const rubric = await callGeminiJSON(prompt);
  return { rubric };
}

async function aiDetectNode(state) {
  const results = await Promise.all(state.submissions.map(async (sub) => {
    const prompt = `Analyze this student submission for AI-generated content indicators:
"${(sub.content || '').slice(0, 2000)}"

Look for: uniform sentence length, lack of personal voice, overly formal language, generic examples, perfect grammar without natural errors.

Return JSON:
{ "aiScore": number 0-100 confidence that this is AI-generated, "indicators": ["list of specific indicators found"], "humanIndicators": ["signs of human writing"] }`;

    const analysis = await callGeminiJSON(prompt);
    return { ...sub, aiScore: analysis.aiScore || 0, aiIndicators: analysis.indicators || [] };
  }));
  return { results };
}

async function plagiarismNode(state) {
  if (state.results.length < 2) return { results: state.results };

  const updatedResults = await Promise.all(state.results.map(async (subI, i) => {
    const matches = await Promise.all(state.results.map(async (subJ, j) => {
      if (i === j) return null;
      const prompt = `Compare these two submissions for semantic similarity (paraphrasing, same ideas rephrased):

Submission A: "${(subI.content || '').slice(0, 1000)}"
Submission B: "${(subJ.content || '').slice(0, 1000)}"

Return JSON:
{ "similarity": number 0-100, "matchedExcerpts": ["brief excerpts that are similar"], "isPlagiarism": boolean }`;

      const result = await callGeminiJSON(prompt);
      if (result.similarity > 40) {
        return {
          matchedStudentId: subJ.studentId,
          similarity: result.similarity,
          excerpt: result.matchedExcerpts?.[0] || ''
        };
      }
      return null;
    }));

    const validMatches = matches.filter(m => m !== null);
    return {
      ...subI,
      semanticMatches: validMatches,
      plagiarismScore: validMatches.length > 0 ? Math.max(...validMatches.map(m => m.similarity)) : 0
    };
  }));
  return { results: updatedResults };
}

async function gradeNode(state) {
  const updatedResults = await Promise.all(state.results.map(async (sub) => {
    const prompt = `Grade this student submission against the rubric:

Assignment brief: "${state.brief}"
Rubric criteria: ${JSON.stringify(state.rubric?.criteria?.map(c => ({ name: c.name, maxPoints: c.maxPoints })))}
Submission: "${(sub.content || '').slice(0, 2000)}"

Return JSON:
{ "grade": number 0-100 total score, "criteriaScores": [{ "criterion": "name", "score": number, "justification": "brief reason" }] }`;

    const grading = await callGeminiJSON(prompt);
    return { ...sub, grade: grading.grade || 0, criteriaScores: grading.criteriaScores || [] };
  }));
  return { results: updatedResults };
}

async function feedbackNode(state) {
  const updatedResults = await Promise.all(state.results.map(async (sub) => {
    const prompt = `Write a personalized, constructive feedback letter for a student.
Grade: ${sub.grade}/100
AI-content flag: ${sub.aiScore > 60 ? 'HIGH - possible AI content detected' : 'Low'}
Plagiarism flag: ${sub.plagiarismScore > 50 ? 'HIGH - similar to other submissions' : 'Low'}
Brief: "${state.brief}"

Write 2-3 paragraphs of helpful, encouraging feedback. Mention strengths and specific improvements.`;

    const feedback = await callGemini(prompt);
    const flags = [];
    if (sub.aiScore > 60) flags.push({ type: 'ai_generated', confidence: sub.aiScore, evidence: (sub.aiIndicators || []).join(', ') });
    if (sub.plagiarismScore > 50) flags.push({ type: 'plagiarism', confidence: sub.plagiarismScore, evidence: 'Semantic similarity detected' });

    return { ...sub, feedback, flags, status: flags.length > 0 ? 'flagged' : 'graded' };
  }));
  return { results: updatedResults };
}

const gradingGraph = new StateGraph(GradingState)
  .addNode('generateRubric', rubricNode)
  .addNode('aiDetect', aiDetectNode)
  .addNode('plagiarism', plagiarismNode)
  .addNode('grade', gradeNode)
  .addNode('feedback', feedbackNode)
  .addEdge(START, 'generateRubric')
  .addEdge('generateRubric', 'aiDetect')
  .addEdge('aiDetect', 'plagiarism')
  .addEdge('plagiarism', 'grade')
  .addEdge('grade', 'feedback')
  .addEdge('feedback', END);

export const runGradingAgent = async (input) => {
  const compiled = gradingGraph.compile();
  return await compiled.invoke(input);
};

export default gradingGraph;
