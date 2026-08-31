import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import User from '../models/User.js';
import Student from '../models/Student.js';

const generateAccessToken = (userId, role) => {
  return jwt.sign({ userId, role }, process.env.JWT_SECRET, { expiresIn: '15m' });
};

const generateRefreshToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_REFRESH_SECRET, { expiresIn: '7d' });
};

const setCookieOptions = () => {
  const isProd = process.env.NODE_ENV === 'production';
  return {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'none' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,

    domain: process.env.COOKIE_DOMAIN === 'localhost' ? undefined : process.env.COOKIE_DOMAIN
  };
};

export const register = async (req, res) => {
  try {
    const { name, email, password, role, department, studentId, semester, subjects } = req.validatedBody;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered', code: 400 });
    }

    if (role === 'student' && studentId) {
      const existingStudentId = await User.findOne({ studentId });
      if (existingStudentId) {
        return res.status(400).json({ error: 'Student ID already registered', code: 400 });
      }
    }

    const userDepartment = department || 'CSE';
    const user = await User.create({ name, email, password, role: 'student', department: userDepartment, studentId });

    await Student.create({ userId: user._id, semester: semester || 1 });

    res.status(201).json({ message: 'Registration successful', user: { _id: user._id, name, email, role: 'student', department: userDepartment } });
  } catch (error) {
    res.status(500).json({ error: error.message, code: 500 });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.validatedBody;

    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password', code: 401 });
    }

    if (!user.isActive) {
      return res.status(403).json({ error: 'Account deactivated', code: 403 });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password', code: 401 });
    }

    const accessToken = generateAccessToken(user._id, user.role);
    const refreshToken = generateRefreshToken(user._id);

    user.refreshToken = refreshToken;
    user.lastLogin = new Date();
    user.isFirstLogin = false;
    await user.save();

    res.cookie('refresh_token', refreshToken, setCookieOptions());

    res.json({
      accessToken,
      refreshToken,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        studentId: user.studentId,
        avatar: user.avatar
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message, code: 500 });
  }
};

export const logout = async (req, res) => {
  try {
    const token = req.cookies?.refresh_token;
    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
      await User.findByIdAndUpdate(decoded.userId, { refreshToken: null });
    }
    res.clearCookie('refresh_token');
    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    res.clearCookie('refresh_token');
    res.json({ message: 'Logged out' });
  }
};

export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found', code: 404 });
    }

    let profileData = await Student.findOne({ userId: user._id });
    res.json({ user: { ...user.toJSON(), profile: profileData } });
  } catch (error) {
    res.status(500).json({ error: error.message, code: 500 });
  }
};

export const refreshToken = async (req, res) => {
  try {
    const accessToken = generateAccessToken(req.user.userId, req.user.role);
    res.json({ accessToken });
  } catch (error) {
    res.status(500).json({ error: error.message, code: 500 });
  }
};

export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.validatedBody;
    const user = await User.findById(req.user.userId).select('+password');

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ error: 'Current password is incorrect', code: 400 });
    }

    user.password = newPassword;
    await user.save();
    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message, code: 500 });
  }
};

export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.validatedBody;
    const user = await User.findOne({ email });
    if (!user) {
      return res.json({ message: 'If the email exists, a reset link has been sent' });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    user.resetToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    user.resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000);
    await user.save();

    res.json({ message: 'If the email exists, a reset link has been sent', resetToken });
  } catch (error) {
    res.status(500).json({ error: error.message, code: 500 });
  }
};

export const resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { newPassword } = req.validatedBody;

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    const user = await User.findOne({
      resetToken: hashedToken,
      resetTokenExpiry: { $gt: new Date() }
    }).select('+resetToken +resetTokenExpiry');

    if (!user) {
      return res.status(400).json({ error: 'Invalid or expired reset token', code: 400 });
    }

    user.password = newPassword;
    user.resetToken = undefined;
    user.resetTokenExpiry = undefined;
    await user.save();

    res.json({ message: 'Password reset successful' });
  } catch (error) {
    res.status(500).json({ error: error.message, code: 500 });
  }
};
