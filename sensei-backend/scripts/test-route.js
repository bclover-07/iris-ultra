import 'dotenv/config';
import connectDB from '../src/config/db.js';
import User from '../src/models/User.js';
import Doubt from '../src/models/Doubt.js';
import HelpTicket from '../src/models/HelpTicket.js';
import { runDoubtSolver } from '../src/agents/doubtSolver.agent.js';

async function test() {
  console.log('Connecting to database...');
  await connectDB();
  
  // Find a student
  const student = await User.findOne({ role: 'student' });
  if (!student) {
    console.error('No student found in DB!');
    process.exit(1);
  }
  console.log(`Testing with student: ${student.name} (${student._id})`);

  try {
    const inputType = 'text';
    const queryText = 'maths';
    
    console.log('Running runDoubtSolver...');
    const result = await runDoubtSolver({
      inputType,
      transcription: '',
      ocrText: '',
      originalQuery: queryText
    });

    console.log('DoubtSolver finished. Result solution keys:', Object.keys(result.solution || {}));
    
    const confidenceScore = result.solution?.confidenceScore !== undefined ? result.solution.confidenceScore : 85;
    const fallbackActive = confidenceScore < 70;
    console.log(`Confidence Score: ${confidenceScore}, Fallback Active: ${fallbackActive}`);

    console.log('Creating Doubt document...');
    const doubt = await Doubt.create({
      studentId: student._id,
      inputType: inputType || 'text',
      transcription: '',
      ocrText: '',
      imageUrl: '',
      originalQuery: queryText,
      courseContext: result.courseContext || '',
      subject: result.subject || '',
      solution: result.solution || {},
      resolved: !fallbackActive
    });
    console.log('Doubt created successfully, ID:', doubt._id);

    if (fallbackActive) {
      console.log('Creating HelpTicket document (Fallback is active)...');
      const ticket = await HelpTicket.create({
        studentId: student._id,
        message: `[AI Doubt Fallback] Student asked: "${queryText}". The AI responded with low confidence (Score: ${confidenceScore}%).`,
        category: 'doubt-solver',
        urgency: 'high',
        status: 'pending'
      });
      console.log('HelpTicket created successfully, ID:', ticket._id);
    }
    
    console.log('Test completed successfully!');
  } catch (error) {
    console.error('Error during route simulation:', error);
  } finally {
    process.exit(0);
  }
}

test();
