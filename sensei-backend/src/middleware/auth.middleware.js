import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import User from '../models/User.js';

export const verifyAccessToken = async (req, res, next) => {
  try {
    let authHeader = req.headers.authorization;
    if (!authHeader && req.query.token) {
      authHeader = `Bearer ${req.query.token}`;
    }

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Access token required', code: 401 });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'sensei_ultra_jwt_secret');
    
    let user;
    if (mongoose.connection.readyState === 1) {
      try {
        user = await User.findById(decoded.userId);
      } catch (_) {}
    }
    }

    req.user = {
      userId: user ? user._id : decoded.userId,
      email: user?.email || decoded.email || 'alex.rivera@sensei.ai',
      role: 'student',
      name: user?.name || decoded.name || 'Alex Rivera',
      department: user?.department || 'Computer Science & AI'
    };
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired', code: 401 });
    }
    return res.status(401).json({ error: 'Invalid token', code: 401 });
  }
};

export const verifyRefreshToken = async (req, res, next) => {
  try {
    const token = req.cookies?.refresh_token || req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: 'Refresh token required', code: 401 });
    }

    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET || 'sensei_ultra_refresh_secret');
    
    req.user = { userId: decoded.userId, role: 'student' };
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid refresh token', code: 401 });
  }
};

export default { verifyAccessToken, verifyRefreshToken };
