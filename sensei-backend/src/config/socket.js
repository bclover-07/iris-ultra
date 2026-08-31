import { Server } from 'socket.io';
import Class from '../models/Class.js';

let io = null;

const initSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: [
        process.env.FRONTEND_URL || 'http://localhost:3000',
        'http://localhost:3000'
      ],
      methods: ['GET', 'POST'],
      credentials: true
    },
    pingTimeout: 60000,
    pingInterval: 25000
  });

  const studentNs = io.of('/student');
  const teacherNs = io.of('/teacher');
  const adminNs = io.of('/admin');

  studentNs.on('connection', async (socket) => {
    const userId = socket.handshake.auth?.userId;
    if (userId) {
      socket.join(userId);
      

      try {
        const classes = await Class.find({ studentIds: userId });
        classes.forEach(c => {
          socket.join(`class:${c._id}`);
          console.log(`Student ${userId} joined room class:${c._id}`);
        });
      } catch (err) {
        console.error('Error auto-joining class rooms:', err.message);
      }
    }
    socket.on('join:class', (classId) => {
      socket.join(`class:${classId}`);
    });
    socket.on('disconnect', () => {});
  });

  teacherNs.on('connection', (socket) => {
    const userId = socket.handshake.auth?.userId;
    if (userId) {
      socket.join(userId);
    }
    socket.on('disconnect', () => {});
  });

  adminNs.on('connection', (socket) => {
    const userId = socket.handshake.auth?.userId;
    if (userId) {
      socket.join(userId);
    }
    socket.on('disconnect', () => {});
  });

  return io;
};

const getIO = () => {
  if (!io) {
    throw new Error('Socket.io not initialized. Call initSocket first.');
  }
  return io;
};

export { initSocket, getIO };
export default getIO;
