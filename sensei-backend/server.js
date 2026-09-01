import 'dotenv/config';
import express from 'express';
import { createServer } from 'http';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import mongoSanitize from 'express-mongo-sanitize';
import hpp from 'hpp';
import winston from 'winston';

import connectDB from './src/config/db.js';
import { initSocket } from './src/config/socket.js';
import { configureCloudinary } from './src/config/cloudinary.js';

import authRoutes from './src/routes/auth.routes.js';
import studentRoutes from './src/routes/student.routes.js';
import quizRoutes from './src/routes/quiz.routes.js';
import studyPlanRoutes from './src/routes/studyPlan.routes.js';
import leaderboardRoutes from './src/routes/leaderboard.routes.js';
import doubtRoutes from './src/routes/doubt.routes.js';
import focusRoutes from './src/routes/focus.routes.js';
import careerRoutes from './src/routes/career.routes.js';
import worldRoutes from './src/routes/world.routes.js';
import interviewRoutes from './src/routes/interview.routes.js';
import debateRoutes from './src/routes/debate.routes.js';
import mentorRoutes from './src/routes/mentor.routes.js';
import voiceJournalRoutes from './src/routes/voiceJournal.routes.js';
import setupWorldSocket from './src/socket/world.socket.js';
import setupDebateSocket from './src/socket/debate.socket.js';
import setupInterviewSocket from './src/socket/interview.socket.js';

const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.simple()
  ),
  transports: [new winston.transports.Console()]
});

const app = express();
const httpServer = createServer(app);

app.set('trust proxy', 1);

app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  crossOriginEmbedderPolicy: false
}));

app.use(cors({
  origin: (origin, callback) => callback(null, true),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());
app.use(mongoSanitize());
app.use(hpp());

// Initialize WebSockets for Multiplayer World Hub
const io = initSocket(httpServer);
app.set('io', io);
setupWorldSocket(io);
setupDebateSocket(io);
setupInterviewSocket(io);

// Student-Only Routes
app.use('/api/auth', authRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/quiz', quizRoutes);
app.use('/api/quizbank', quizRoutes);
app.use('/api/study-plan', studyPlanRoutes);
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/doubt', doubtRoutes);
app.use('/api/focus', focusRoutes);
app.use('/api/career', careerRoutes);
app.use('/api/world', worldRoutes);
app.use('/api/interview', interviewRoutes);
app.use('/api/debate', debateRoutes);
app.use('/api/mentor', mentorRoutes);
app.use('/api/voice-journal', voiceJournalRoutes);

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    version: '3.0.0-NPU-Edge',
    architecture: 'Local-NPU-Gemma-Hexagon',
    timestamp: new Date().toISOString()
  });
});

app.use((err, req, res, next) => {
  logger.error('Unhandled error:', {
    message: err.message,
    path: req.path,
    method: req.method
  });
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    error: err.message || 'Internal server error',
    code: statusCode
  });
});

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    configureCloudinary();

    httpServer.listen(PORT, () => {
      logger.info(`SENSEI Ultra Backend running on port ${PORT}`);
      logger.info(`Student-Only & Local-NPU Architecture Ready`);
    });

    connectDB().catch(err => {
      logger.warn(`Background DB connection notice: ${err.message}`);
    });
  } catch (error) {
    logger.error(`Server startup failed: ${error.message}`);
    process.exit(1);
  }
};

startServer();

export default app;
