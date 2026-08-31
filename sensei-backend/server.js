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
import interventionRoutes from './src/routes/intervention.routes.js';
import notesRoutes from './src/routes/notes.routes.js';
import chatbotRoutes from './src/routes/chatbot.routes.js';
import leaderboardRoutes from './src/routes/leaderboard.routes.js';
import videoRoutes from './src/routes/video.routes.js';
import helpTicketRoutes from './src/routes/helpTicket.routes.js';
import uploadRoutes from './src/routes/upload.routes.js';
import pollRoutes from './src/routes/poll.routes.js';
import analyticsRoutes from './src/routes/analytics.routes.js';
import ttsRoutes from './src/routes/tts.routes.js';
import doubtRoutes from './src/routes/doubt.routes.js';
import focusRoutes from './src/routes/focus.routes.js';
import careerRoutes from './src/routes/career.routes.js';
import assignmentRoutes from './src/routes/assignment.routes.js';
import behaviorRoutes from './src/routes/behavior.routes.js';
import dropoutRoutes from './src/routes/dropout.routes.js';
import resourceRoutes from './src/routes/resource.routes.js';
import worldRoutes from './src/routes/world.routes.js';
import interviewRoutes from './src/routes/interview.routes.js';
import debateRoutes from './src/routes/debate.routes.js';
import overcomeRoutes from './src/routes/overcome.routes.js';
import setupWorldSocket from './src/socket/world.socket.js';
import setupInterviewSocket from './src/socket/interview.socket.js';
import setupDebateSocket from './src/socket/debate.socket.js';
import notificationRoutes from './src/routes/notification.routes.js';

const transports = [
  new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    )
  })
];

if (process.env.NODE_ENV === 'production') {
  transports.push(
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' })
  );
}

const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports
});

const app = express();
app.use((req, res, next) => {
  console.log(`[Request] ${req.method} ${req.originalUrl} | User: ${req.user ? req.user.userId : 'anonymous'}`);
  const oldJson = res.json;
  res.json = function(data) {
    console.log(`[Response] ${req.method} ${req.originalUrl} -> ${res.statusCode} | Payload:`, JSON.stringify(data).slice(0, 200));
    return oldJson.apply(res, arguments);
  };
  next();
});
const httpServer = createServer(app);

app.set('trust proxy', 1);

app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  crossOriginEmbedderPolicy: false
}));

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || origin.startsWith('http://localhost') || origin.startsWith('http://127.0.0.1') || origin.startsWith('http://192.168.')) {
      callback(null, true);
    } else {
      const allowedOrigins = [
        process.env.FRONTEND_URL || 'http://localhost:3000',
        'http://localhost:3000',
        'http://localhost:3001'
      ];
      if (allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        callback(null, false);
      }
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());
app.use(mongoSanitize());
app.use(hpp());

const io = initSocket(httpServer);
app.set('io', io);
setupWorldSocket(io);
setupInterviewSocket(io);
setupDebateSocket(io);

app.use('/api/auth', authRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/quiz', quizRoutes);
app.use('/api/study-plan', studyPlanRoutes);
app.use('/api/intervention', interventionRoutes);
app.use('/api/notes', notesRoutes);
app.use('/api/chatbot', chatbotRoutes);
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/video', videoRoutes);
app.use('/api/help-ticket', helpTicketRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/poll', pollRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/tts', ttsRoutes);
app.use('/api/doubt', doubtRoutes);
app.use('/api/focus', focusRoutes);
app.use('/api/career', careerRoutes);
app.use('/api/assignment', assignmentRoutes);
app.use('/api/behavior', behaviorRoutes);
app.use('/api/dropout', dropoutRoutes);
app.use('/api/resource', resourceRoutes);
app.use('/api/world', worldRoutes);
app.use('/api/interview', interviewRoutes);
app.use('/api/debate', debateRoutes);
app.use('/api/overcome', overcomeRoutes);
app.use('/api/notifications', notificationRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use((err, req, res, next) => {
  logger.error('Unhandled error:', {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method
  });

  console.error('API Error:', err);
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    error: process.env.NODE_ENV === 'production'
      ? 'Internal server error'
      : err.message,
    code: statusCode
  });
});

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDB();
    configureCloudinary();

    httpServer.listen(PORT, () => {
      logger.info(`Sensei backend running on port ${PORT}`);
      logger.info(`Environment: ${process.env.NODE_ENV}`);
    });
  } catch (error) {
    logger.error(`MongoDB connection failed: ${error.message}`);
    process.exit(1);
  }
};

startServer();

export default app;
