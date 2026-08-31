import 'dotenv/config';
import { analyzeVideo } from '../src/agents/videoAnalyzer.agent.js';

async function test() {
  console.log('Testing video analyzer with a sample YouTube video...');
  try {
    const result = await analyzeVideo('https://youtu.be/Xe8CkYZvCig?si=Vuft8jYNISrqJGCa');
    console.log('Analysis Complete!');
    console.log('Result keys:', Object.keys(result));
    console.log('Error:', result.error);
    console.log('Summary:', JSON.stringify(result.summary, null, 2));
    console.log('Chapters Count:', result.chapters?.length || 0);
    console.log('Summary Cards Count:', result.summaryCards?.length || 0);
  } catch (e) {
    console.error('Execution failed:', e.message);
  }
}
test();
