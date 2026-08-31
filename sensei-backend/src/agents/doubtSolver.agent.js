import { Annotation, StateGraph, START, END } from '@langchain/langgraph';
import { callGeminiJSON, callGemini } from '../services/gemini.service.js';

const DoubtState = Annotation.Root({
  inputType: Annotation({ reducer: (a, b) => b ?? a, default: () => 'text' }),
  transcription: Annotation({ reducer: (a, b) => b ?? a, default: () => '' }),
  ocrText: Annotation({ reducer: (a, b) => b ?? a, default: () => '' }),
  originalQuery: Annotation({ reducer: (a, b) => b ?? a, default: () => '' }),
  courseContext: Annotation({ reducer: (a, b) => b ?? a, default: () => '' }),
  subject: Annotation({ reducer: (a, b) => b ?? a, default: () => '' }),
  combinedQuery: Annotation({ reducer: (a, b) => b ?? a, default: () => '' }),
  solution: Annotation({ reducer: (a, b) => b ?? a, default: () => ({}) })
});

async function transcribeNode(state) {
  let combinedQuery = state.originalQuery || '';
  if (state.transcription) {
    combinedQuery = state.transcription;
  }
  return { combinedQuery };
}

async function ocrNode(state) {
  let combinedQuery = state.combinedQuery;
  if (state.ocrText) {
    combinedQuery = `${combinedQuery}\n\nHandwritten/OCR content: ${state.ocrText}`;
  }
  return { combinedQuery };
}

async function contextNode(state) {
  try {
    const contextPrompt = `Given this student doubt: "${state.combinedQuery}"
Identify the subject area and any relevant academic context. Return JSON:
{ "subject": "...", "context": "brief academic context for this topic", "difficulty": "basic|intermediate|advanced" }`;

    const result = await callGeminiJSON(contextPrompt);
    return {
      subject: result.subject || 'General',
      courseContext: result.context || ''
    };
  } catch (err) {
    console.error('Context node failed, using fallback:', err.message);
    return {
      subject: 'General',
      courseContext: 'Academic question'
    };
  }
}

async function solveNode(state) {
  try {
    const solvePrompt = `You are an expert tutor. A student has this doubt:
"${state.combinedQuery}"

Subject: ${state.subject}
Context: ${state.courseContext}

Generate a detailed step-by-step solution. Return JSON:
{
  "steps": [
    { "stepNumber": 1, "title": "Step title", "content": "Detailed explanation", "latex": "any math formula if applicable", "visual": "description of visual aid" }
  ],
  "explanation": "Overall explanation of the concept",
  "summary": "One-line summary of the answer",
  "confidenceScore": a number from 0 to 100 representing your confidence in this solution. Set it below 70 if the doubt is vague, ambiguous, nonsensical, or lacks clear context.
}

Make it educational — explain WHY, not just what. Include 3-6 clear steps.`;

    const solution = await callGeminiJSON(solvePrompt);
    return { solution };
  } catch (err) {
    console.error('Solve node failed:', err.message);

    return {
      solution: {
        explanation: `I apologize, but I'm having trouble processing this right now. Your question was: "${state.combinedQuery}". Please try again in a moment.`,
        steps: [
          { stepNumber: 1, title: 'Temporary Issue', content: 'The AI service is currently experiencing high load. Please try submitting your doubt again in a few seconds.', latex: '', visual: '' }
        ],
        summary: 'Please retry — the AI service is temporarily busy.',
        confidenceScore: 30
      }
    };
  }
}

async function narrateNode(state) {
  try {
    const narratePrompt = `Create a brief, friendly narration for this solution that a student can read aloud or listen to. The solution steps are:
${JSON.stringify(state.solution?.steps || [])}

Write a conversational walkthrough in 2-3 paragraphs. Be encouraging and clear.`;

    const narration = await callGemini(narratePrompt);
    const updatedSolution = { ...state.solution, narration };
    return { solution: updatedSolution };
  } catch (err) {
    console.error('Narrate node failed, skipping narration:', err.message);
    return { solution: state.solution };
  }
}

const doubtSolverGraph = new StateGraph(DoubtState)
  .addNode('transcribe', transcribeNode)
  .addNode('ocr', ocrNode)
  .addNode('context', contextNode)
  .addNode('solve', solveNode)
  .addNode('narrate', narrateNode)
  .addEdge(START, 'transcribe')
  .addEdge('transcribe', 'ocr')
  .addEdge('ocr', 'context')
  .addEdge('context', 'solve')
  .addEdge('solve', 'narrate')
  .addEdge('narrate', END);

export const runDoubtSolver = async (input) => {
  const compiled = doubtSolverGraph.compile();
  return await compiled.invoke(input);
};

export default doubtSolverGraph;
