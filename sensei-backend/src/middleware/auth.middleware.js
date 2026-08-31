import jwt from 'jsonwebtoken';
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
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    const user = await User.findById(decoded.userId);
    if (!user || !user.isActive) {
      return res.status(401).json({ error: 'User not found or inactive', code: 401 });
    }

    req.user = {
      userId: user._id,
      email: user.email,
      role: user.role,
      name: user.name,
      department: user.department,
      studentId: user.studentId
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

    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
    
    const user = await User.findById(decoded.userId).select('+refreshToken');
    if (!user || user.refreshToken !== token) {
      return res.status(401).json({ error: 'Invalid refresh token', code: 401 });
    }

    req.user = { userId: user._id, email: user.email, role: user.role };
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid refresh token', code: 401 });
  }
};
