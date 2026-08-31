import { Annotation, StateGraph, START, END } from '@langchain/langgraph';
import { callGeminiJSON } from '../services/gemini.service.js';
import { fetchTranscript } from '../utils/youtubeTranscript.js';
import { summarizeWithHF } from '../services/huggingface.service.js';
import { registerAgent } from '../services/langGraph.service.js';

const VideoAnalysisState = Annotation.Root({
  videoUrl: Annotation({ reducer: (_, n) => n, default: () => '' }),
  transcript: Annotation({ reducer: (_, n) => n, default: () => null }),
  summary: Annotation({ reducer: (_, n) => n, default: () => null }),
  keyPoints: Annotation({ reducer: (_, n) => n, default: () => [] }),
  summaryCards: Annotation({ reducer: (_, n) => n, default: () => [] }),
  chapters: Annotation({ reducer: (_, n) => n, default: () => [] }),
  charts: Annotation({ reducer: (_, n) => n, default: () => [] }),
  diagrams: Annotation({ reducer: (_, n) => n, default: () => [] }),
  error: Annotation({ reducer: (_, n) => n, default: () => null }),
});

async function extractTranscript(state) {
  try {
    const transcript = await fetchTranscript(state.videoUrl);
    return { transcript };
  } catch (error) {
    return { error: `Transcript extraction failed: ${error.message}` };
  }
}

async function analyzeContent(state) {
  if (state.error || !state.transcript) return {};

  try {
    const text = state.transcript.fullText.slice(0, 4000);

    let hfSummary = '';
    try {
      hfSummary = await summarizeWithHF(text.slice(0, 3000), 300);
    } catch (_) {
      hfSummary = '';
    }

    const analysisPrompt = `You are an expert educational content analyzer. Analyze this video transcript thoroughly.

TRANSCRIPT:
${text}

${hfSummary ? `HuggingFace Summary (for reference): ${hfSummary}` : ''}

Return ONLY valid JSON with this EXACT structure:
{
  "title": "Descriptive title for the video",
  "summary": "Comprehensive 3-paragraph summary covering all major topics discussed",
  "keyPoints": ["point1", "point2", "point3", "point4", "point5", "point6", "point7", "point8"],
  "chapters": [
    { "title": "Chapter Title", "startTime": "0:00", "content": "What is covered in this section" }
  ],
  "conceptMap": [
    { "concept": "Main Concept", "subConcepts": ["sub1", "sub2"], "relationships": ["relates to X", "depends on Y"] }
  ]
}`;

    const result = await callGeminiJSON(analysisPrompt);

    return {
      summary: {
        title: result.title || 'Video Analysis',
        summary: result.summary || hfSummary || 'Analysis complete',
        keyPoints: result.keyPoints || []
      },
      keyPoints: result.keyPoints || [],
      chapters: result.chapters || [],
    };
  } catch (error) {
    return { error: `Content analysis failed: ${error.message}` };
  }
}

async function generateVisuals(state) {
  if (state.error || !state.summary) return {};

  try {
    const visualPrompt = `Based on this educational content analysis, generate rich visual learning aids.

SUMMARY: ${state.summary.summary?.slice(0, 1500) || ''}
KEY POINTS: ${JSON.stringify(state.keyPoints?.slice(0, 6) || [])}

Return ONLY valid JSON:
{
  "summaryCards": [
    { "title": "Card Title", "keyPoint": "Concise insight", "emoji": "🎯", "color": "#8B5CF6", "category": "concept" },
    { "title": "Card Title", "keyPoint": "Concise insight", "emoji": "💡", "color": "#3B82F6", "category": "technique" },
    { "title": "Card Title", "keyPoint": "Concise insight", "emoji": "⚡", "color": "#10B981", "category": "application" },
    { "title": "Card Title", "keyPoint": "Concise insight", "emoji": "🔬", "color": "#F59E0B", "category": "example" },
    { "title": "Card Title", "keyPoint": "Concise insight", "emoji": "🧠", "color": "#EF4444", "category": "critical" },
    { "title": "Card Title", "keyPoint": "Concise insight", "emoji": "🎓", "color": "#06B6D4", "category": "summary" }
  ],
  "charts": [
    {
      "type": "progress",
      "title": "Topic Difficulty Distribution",
      "data": [
        { "name": "Beginner", "value": 30, "color": "#10B981" },
        { "name": "Intermediate", "value": 45, "color": "#3B82F6" },
        { "name": "Advanced", "value": 25, "color": "#8B5CF6" }
      ]
    },
    {
      "type": "timeline",
      "title": "Learning Progression",
      "data": [
        { "phase": "Foundation", "duration": "2 days", "topics": 3 },
        { "phase": "Core", "duration": "4 days", "topics": 5 },
        { "phase": "Advanced", "duration": "3 days", "topics": 4 },
        { "phase": "Mastery", "duration": "2 days", "topics": 2 }
      ]
    },
    {
      "type": "radar",
      "title": "Skill Coverage",
      "data": [
        { "skill": "Theory", "value": 80 },
        { "skill": "Practice", "value": 65 },
        { "skill": "Application", "value": 70 },
        { "skill": "Analysis", "value": 75 },
        { "skill": "Synthesis", "value": 60 }
      ]
    }
  ],
  "diagrams": [
    {
      "type": "flowchart",
      "title": "Concept Flow",
      "nodes": [
        { "id": "1", "label": "Start", "type": "start" },
        { "id": "2", "label": "Core Concept", "type": "process" },
        { "id": "3", "label": "Application", "type": "process" },
        { "id": "4", "label": "Mastery", "type": "end" }
      ],
      "edges": [
        { "from": "1", "to": "2" },
        { "from": "2", "to": "3" },
        { "from": "3", "to": "4" }
      ]
    }
  ]
}`;

    const visuals = await callGeminiJSON(visualPrompt);

    return {
      summaryCards: visuals.summaryCards || [],
      charts: visuals.charts || [],
      diagrams: visuals.diagrams || [],
    };
  } catch (error) {
    console.error('[VideoAnalyzer] Visual generation error:', error.message);
    return {
      summaryCards: state.keyPoints.slice(0, 6).map((kp, i) => ({
        title: `Key Insight ${i + 1}`,
        keyPoint: kp,
        emoji: ['🎯', '💡', '⚡', '🔬', '🧠', '🎓'][i % 6],
        color: ['#8B5CF6', '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#06B6D4'][i % 6],
        category: 'insight'
      })),
      charts: [],
      diagrams: [],
    };
  }
}

function shouldContinueAfterTranscript(state) {
  if (state.error || !state.transcript) return END;
  return 'analyzeContent';
}

function shouldContinueAfterAnalysis(state) {
  if (state.error || !state.summary) return END;
  return 'generateVisuals';
}

const videoAnalyzerGraph = new StateGraph(VideoAnalysisState)
  .addNode('extractTranscript', extractTranscript)
  .addNode('analyzeContent', analyzeContent)
  .addNode('generateVisuals', generateVisuals)
  .addEdge(START, 'extractTranscript')
  .addConditionalEdges('extractTranscript', shouldContinueAfterTranscript)
  .addConditionalEdges('analyzeContent', shouldContinueAfterAnalysis)
  .addEdge('generateVisuals', END);

registerAgent('videoAnalyzer', videoAnalyzerGraph);

export const analyzeVideo = async (videoUrl) => {
  const compiled = videoAnalyzerGraph.compile();
  const result = await compiled.invoke({ videoUrl });
  return result;
};

export default { analyzeVideo };
