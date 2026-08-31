import 'dotenv/config';
import { runDoubtSolver } from '../src/agents/doubtSolver.agent.js';

async function test() {
  console.log('Starting Doubt Solver test...');
  try {
    const result = await runDoubtSolver({
      inputType: 'text',
      originalQuery: 'What is 2+2?'
    });
    console.log('Success! Result:', JSON.stringify(result, null, 2));
  } catch (error) {
    console.error('Error running runDoubtSolver:', error);
  }
}

test();
