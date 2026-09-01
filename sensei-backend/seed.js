import 'dotenv/config';
import mongoose from 'mongoose';
import connectDB from './src/config/db.js';
import User from './src/models/User.js';
import StudentProfile from './src/models/StudentProfile.js';
import Leaderboard from './src/models/Leaderboard.js';
import StudyPlan from './src/models/StudyPlan.js';
import Quiz from './src/models/Quiz.js';

const DEMO_STUDENTS = [
  {
    name: 'Aarav Sharma',
    email: 'aarav.sharma.cse@sensei.edu',
    password: 'student123',
    department: 'CSE',
    semester: 5
  },
  {
    name: 'Priya Patel',
    email: 'priya.patel.it@sensei.edu',
    password: 'student123',
    department: 'IT',
    semester: 5
  },
  {
    name: 'Rohan Kumar',
    email: 'rohan.kumar.ai@sensei.edu',
    password: 'student123',
    department: 'AI',
    semester: 5
  }
];

async function runSeed() {
  try {
    await connectDB();
    console.log('Connected to MongoDB');

    await User.deleteMany({});
    await StudentProfile.deleteMany({});
    await Leaderboard.deleteMany({});
    await StudyPlan.deleteMany({});
    await Quiz.deleteMany({});
    console.log('Cleared existing collections for Sensei Ultra Student OS');

    const createdUsers = [];
    for (const demo of DEMO_STUDENTS) {
      const user = await User.create({
        name: demo.name,
        email: demo.email.toLowerCase(),
        password: demo.password,
        role: 'student',
        department: demo.department,
        semester: demo.semester,
        interests: ['Artificial Intelligence', 'Full Stack Development', 'Data Science']
      });

      const profile = await StudentProfile.create({
        userId: user._id,
        presenceConsistency: { score: 88, totalVerifiedMinutes: 45, verifiedSessionsCount: 3, streakDays: 3 },
        quizMastery: { score: 82, totalAnswered: 24, totalCorrect: 20 },
        studyPlanProgress: { score: 70, completedTasks: 7, totalTasks: 10 },
        wellness: { score: 92, breathingComplianceAvg: 95, ambientScoreAvg: 90, recentSentiment: 'motivated' },
        engagement: { score: 85, mentorVoiceTurns: 12, doubtSessionsCount: 4, practiceSessionsCount: 2 },
        riskModel: { riskTier: 'low', riskScore: 10, topContributingFactors: ['High quiz consistency', 'Active mentor participation'] }
      });

      createdUsers.push(user);
      console.log(`Seeded user: ${user.name} (${user.email})`);
    }

    console.log('\n✅ Sensei Ultra Student OS Seed complete!');
    console.log('Demo Credentials:');
    createdUsers.forEach(u => console.log(` - ${u.email} / student123`));
    process.exit(0);
  } catch (err) {
    console.error('Seed error:', err);
    process.exit(1);
  }
}

runSeed();
