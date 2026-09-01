import mongoose from 'mongoose';
import winston from 'winston';
import User from '../models/User.js';
import StudentProfile from '../models/StudentProfile.js';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [new winston.transports.Console()]
});

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

async function autoSeedDemoUsers() {
  try {
    const userCount = await User.countDocuments();
    if (userCount === 0) {
      logger.info('No users found in database. Auto-seeding quick demo student accounts...');
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

        await StudentProfile.create({
          userId: user._id,
          presenceConsistency: { score: 88, totalVerifiedMinutes: 45, verifiedSessionsCount: 3, streakDays: 3 },
          quizMastery: { score: 82, totalAnswered: 24, totalCorrect: 20 },
          studyPlanProgress: { score: 70, completedTasks: 7, totalTasks: 10 },
          wellness: { score: 92, breathingComplianceAvg: 95, ambientScoreAvg: 90, recentSentiment: 'motivated' },
          engagement: { score: 85, mentorVoiceTurns: 12, doubtSessionsCount: 4, practiceSessionsCount: 2 },
          riskModel: { riskTier: 'low', riskScore: 10, topContributingFactors: ['High quiz consistency', 'Active mentor participation'] }
        });
      }
      logger.info('Demo student accounts seeded successfully!');
    }
  } catch (err) {
    logger.warn(`Auto-seed notice: ${err.message}`);
  }
}

const connectDB = async () => {
  const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/sensei_ultra';
  try {
    const conn = await mongoose.connect(uri, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });

    logger.info(`MongoDB connected successfully: ${conn.connection.host}`);

    mongoose.connection.on('error', (err) => {
      logger.error('MongoDB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB disconnected. Attempting reconnect...');
    });

    mongoose.connection.on('reconnected', () => {
      logger.info('MongoDB reconnected');
    });

    await autoSeedDemoUsers();
    return conn;
  } catch (error) {
    logger.error(`MongoDB connection failed (${uri}): ${error.message}`);
    // Try fallback to memory server if available
    try {
      const { MongoMemoryServer } = await import('mongodb-memory-server');
      const mongod = await MongoMemoryServer.create();
      const memoryUri = mongod.getUri();
      const conn = await mongoose.connect(memoryUri);
      logger.info(`Connected to In-Memory MongoDB Fallback: ${memoryUri}`);
      await autoSeedDemoUsers();
      return conn;
    } catch (fallbackError) {
      logger.error(`In-Memory MongoDB fallback failed: ${fallbackError.message}`);
    }
  }
};

export default connectDB;

