import 'dotenv/config';
import connectDB from '../src/config/db.js';
import User from '../src/models/User.js';
import Student from '../src/models/Student.js';
import { getLeaderboard } from '../src/controllers/student.controller.js';

async function test() {
  console.log('Connecting to database...');
  await connectDB();
  
  const studentUser = await User.findOne({ role: 'student' });
  if (!studentUser) {
    console.error('No student found in DB!');
    process.exit(1);
  }

  const req = {
    user: {
      userId: studentUser._id.toString()
    }
  };

  const res = {
    json: (data) => {
      console.log('JSON Response:', JSON.stringify(data, null, 2));
    },
    status: (code) => {
      console.log('Status code set to:', code);
      return res;
    }
  };

  console.log(`Running getLeaderboard for student: ${studentUser.name}...`);
  try {
    await getLeaderboard(req, res);
  } catch (err) {
    console.error('getLeaderboard threw error:', err);
  } finally {
    process.exit(0);
  }
}

test();
