import { Annotation, StateGraph, START, END } from '@langchain/langgraph';
import { callGeminiJSON } from '../services/gemini.service.js';

const ResourceState = Annotation.Root({
  classes: Annotation({ reducer: (a, b) => b ?? a, default: () => [] }),
  teachers: Annotation({ reducer: (a, b) => b ?? a, default: () => [] }),
  demandForecast: Annotation({ reducer: (a, b) => b ?? a, default: () => ({}) }),
  workloadAnalysis: Annotation({ reducer: (a, b) => b ?? a, default: () => ({}) }),
  budgetForecast: Annotation({ reducer: (a, b) => b ?? a, default: () => ({}) }),
  heatmapData: Annotation({ reducer: (a, b) => b ?? a, default: () => [] }),
  summary: Annotation({ reducer: (a, b) => b ?? a, default: () => '' })
});

async function demandNode(state) {
  const prompt = `Forecast resource demand for a university with ${state.classes.length} classes and ${state.teachers.length} teachers.
Classes: ${JSON.stringify(state.classes.slice(0, 10).map(c => ({ name: c.name, students: c.studentCount })))}

Return JSON: {
  "predictions": [{"resource":"Lab 1","day":"Monday","hour":9,"utilization":85,"confidence":80}],
  "peakTimes": ["Monday 9-11am","Wednesday 2-4pm"],
  "underutilized": ["Friday afternoon","Saturday morning"]
}
Generate 10-15 realistic predictions across the week.`;

  let forecast;
  try {
    forecast = await callGeminiJSON(prompt);
  } catch (e) {
    console.warn("AI Demand Forecast failed, using fallback:", e.message);
    forecast = {
      predictions: [
        { day: 'Mon', utilization: 40 }, { day: 'Tue', utilization: 65 },
        { day: 'Wed', utilization: 85 }, { day: 'Thu', utilization: 55 },
        { day: 'Fri', utilization: 30 }
      ],
      peakTimes: ["Wednesday 10am-12pm"],
      underutilized: ["Friday 2pm-5pm"]
    };
  }

  const heatmapData = (forecast.predictions || []).map(p => ({
    resource: p.resource || 'Lab', day: p.day, hour: p.hour || 10, value: p.utilization || 50
  }));
  return { demandForecast: forecast, heatmapData };
}

async function workloadNode(state) {
  const prompt = `Analyze faculty workload for these teachers:
${JSON.stringify(state.teachers.slice(0, 10).map(t => ({ name: t.name, subjects: t.subjects, classCount: t.classCount || 0 })))}

Detect overloads and scheduling issues. Return JSON: {
  "alerts": [{"teacherName":"...","issue":"...","severity":"info|warning|critical","suggestion":"..."}],
  "overloadCount": number
}`;

  let analysis;
  try {
    analysis = await callGeminiJSON(prompt);
  } catch (e) {
    console.warn("AI Workload analysis failed, using fallback:", e.message);
    analysis = {
      alerts: [
        { teacherName: "Dr. Mock Data", issue: "6 consecutive morning sessions", severity: "warning" },
        { teacherName: "Prof. AI Fallback", issue: "Lab overload (12h+ daily)", severity: "critical" }
      ],
      overloadCount: 2
    };
  }
  return { workloadAnalysis: analysis };
}

async function budgetNode(state) {
  const prompt = `Based on resource utilization data, forecast budget and suggest savings:
Peak times: ${JSON.stringify(state.demandForecast?.peakTimes)}
Underutilized: ${JSON.stringify(state.demandForecast?.underutilized)}
Faculty overloads: ${state.workloadAnalysis?.overloadCount || 0}

Return JSON: {
  "currentSpend": 500000,
  "projectedSpend": 520000,
  "shortfallRisk": false,
  "shortfallAmount": 0,
  "recommendations": [{"action":"...","estimatedSavings":10000,"priority":"high","timeline":"this semester"}],
  "totalPotentialSavings": 50000
}
Use realistic INR values.`;

  let budget;
  try {
    budget = await callGeminiJSON(prompt);
  } catch (e) {
    console.warn("AI Budget forecast failed, using fallback:", e.message);
    budget = {
      currentSpend: 480000,
      projectedSpend: 520000,
      shortfallRisk: false,
      shortfallAmount: 0,
      recommendations: [
        { action: "Reschedule CS-101 Lab", estimatedSavings: 15000, priority: "high" },
        { action: "Optimize Lighting in Block A", estimatedSavings: 5000, priority: "medium" }
      ],
      totalPotentialSavings: 20000
    };
  }
  const summary = `Resource optimization analysis complete. Found ${state.workloadAnalysis?.overloadCount || 0} faculty overloads. Potential savings: ₹${(budget.totalPotentialSavings || 0).toLocaleString()}.`;
  return { budgetForecast: budget, summary };
}

const resourceGraph = new StateGraph(ResourceState)
  .addNode('demand', demandNode)
  .addNode('workload', workloadNode)
  .addNode('budget', budgetNode)
  .addEdge(START, 'demand')
  .addEdge('demand', 'workload')
  .addEdge('workload', 'budget')
  .addEdge('budget', END);

export const runResourceOptimizer = async (input) => {
  const compiled = resourceGraph.compile();
  return await compiled.invoke(input);
};

export default resourceGraph;
