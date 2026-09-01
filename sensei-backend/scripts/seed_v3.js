import 'dotenv/config';
import mongoose from 'mongoose';
import User from '../src/models/User.js';
import StudentProfile from '../src/models/StudentProfile.js';
import QuizQuestion from '../src/models/QuizQuestion.js';
import StudyPlan from '../src/models/StudyPlan.js';

async function seedV3() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB successfully!');

    let user = await User.findOne({ email: 'alex.rivera@sensei.ai' });
    if (!user) {
      user = await User.create({
        name: 'Alex Rivera',
        email: 'alex.rivera@sensei.ai',
        password: 'password123',
        role: 'student',
        department: 'Computer Science & AI',
        semester: 4,
        avatar: 'avatar_1',
        interests: ['Machine Learning', 'Systems Architecture', 'Edge NPU'],
        skills: ['Python', 'Dart/Flutter', 'PyTorch', 'C++'],
        targetCompanies: ['Qualcomm', 'Google', 'Apple', 'NVIDIA']
      });
      console.log('Created student user: alex.rivera@sensei.ai / password123');
    } else {
      console.log('User alex.rivera@sensei.ai already exists');
    }

    let profile = await StudentProfile.findOne({ userId: user._id });
    if (!profile) {
      profile = await StudentProfile.create({
        userId: user._id,
        presenceConsistency: {
          score: 92,
          totalVerifiedMinutes: 120,
          verifiedSessionsCount: 6,
          streakDays: 4,
          lastVerifiedAt: new Date()
        },
        quizMastery: {
          score: 86,
          totalAnswered: 24,
          totalCorrect: 21,
          gestureAccuracy: 0.94,
          topicScores: { 'DSA': 90, 'Operating Systems': 85, 'Machine Learning': 88 }
        },
        studyPlanProgress: {
          score: 78,
          activePlanId: null,
          totalTasks: 12,
          completedTasks: 9,
          lastTaskCompletedAt: new Date()
        },
        wellness: {
          score: 90,
          averageBreathingCompliance: 0.92,
          recentSentiment: 'positive',
          ambientStabilityScore: 88
        },
        engagement: {
          score: 88,
          mentorVoiceTurns: 15,
          doubtScansCount: 8,
          practiceSessionsCount: 4,
          worldRoomsJoined: 3
        },
        riskModel: {
          riskScore: 12,
          riskTier: 'low',
          drivingFactors: ['Consistent verified study posture', 'High gesture quiz accuracy'],
          interventions: []
        },
        xp: 1950,
        level: 4,
        streak: 9
      });
      console.log('Created StudentProfile for Alex Rivera');
    }

    // Seed Camo Quizo Questions
    const count = await QuizQuestion.countDocuments();
    if (count < 5) {
      const questions = [
        {
          subject: 'Operating Systems',
          difficulty: 'Medium',
          question: 'Which scheduling algorithm is non-preemptive and selects the process with the smallest execution time?',
          options: ['Round Robin (RR)', 'Shortest Job First (SJF)', 'Priority Scheduling', 'First-Come, First-Served (FCFS)'],
          correctIndex: 1,
          explanation: 'Shortest Job First (SJF) selects the waiting process with the smallest execution burst time.',
          topic: 'Process Scheduling'
        },
        {
          subject: 'Algorithms',
          difficulty: 'Hard',
          question: 'What is the tightest upper bound time complexity of finding the Median-of-Medians in an unsorted array?',
          options: ['O(N log N)', 'O(N^2)', 'O(N)', 'O(log N)'],
          correctIndex: 2,
          explanation: 'Median-of-Medians runs in strictly deterministic linear time O(N).',
          topic: 'Order Statistics'
        },
        {
          subject: 'Deep Learning',
          difficulty: 'Medium',
          question: 'Which hardware component performs matrix multiplication with highest energy efficiency on mobile devices?',
          options: ['Vector CPU', 'Adreno GPU', 'Hexagon NPU / Tensor Core', 'DRAM Controller'],
          correctIndex: 2,
          explanation: 'Dedicated Neural Processing Units (NPUs) feature specialized systolic arrays tailored for INT8/FP16 tensor ops.',
          topic: 'Hardware Acceleration'
        },
        {
          subject: 'Computer Networks',
          difficulty: 'Easy',
          question: 'Which layer of the OSI model does the Transport Layer Security (TLS) protocol operate just above?',
          options: ['Application Layer', 'Transport Layer (TCP)', 'Network Layer (IP)', 'Physical Layer'],
          correctIndex: 1,
          explanation: 'TLS operates right above the Transport layer (TCP) to encrypt application payload streams.',
          topic: 'Network Security'
        }
      ];

      await QuizQuestion.insertMany(questions);
      console.log(`Seeded ${questions.length} Camo Quizo questions.`);
    }

    console.log('✅ Seed v3 completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Seed error:', error);
    process.exit(1);
  }
}

seedV3();
