import { Router } from 'express';
import { z } from 'zod';
import { register, login, logout, getMe, refreshToken, changePassword, forgotPassword, resetPassword } from '../controllers/auth.controller.js';
import { verifyAccessToken, verifyRefreshToken } from '../middleware/auth.middleware.js';
import { requireRole } from '../middleware/role.middleware.js';
import { validate } from '../middleware/validate.middleware.js';

const router = Router();

const VALID_DEPARTMENTS = ['CSE', 'IT', 'BTECH', 'AI'];

const registerSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  password: z.string().min(6).max(128),
  role: z.enum(['student', 'teacher', 'admin']).optional().default('student'),
  department: z.string().optional(),
  studentId: z.string().optional(),
  semester: z.number().min(1).max(8).optional(),
  subjects: z.array(z.string()).optional()
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(6).max(128)
});

const forgotPasswordSchema = z.object({
  email: z.string().email()
});

const resetPasswordSchema = z.object({
  newPassword: z.string().min(6).max(128)
});

router.post('/register', validate(registerSchema), register);
router.post('/login', validate(loginSchema), login);
router.post('/logout', logout);
router.get('/me', verifyAccessToken, getMe);
router.post('/refresh', verifyRefreshToken, refreshToken);
router.post('/change-password', verifyAccessToken, validate(changePasswordSchema), changePassword);
router.post('/forgot-password', validate(forgotPasswordSchema), forgotPassword);
router.post('/reset-password/:token', validate(resetPasswordSchema), resetPassword);
router.get('/departments', (req, res) => {
  res.json({ departments: VALID_DEPARTMENTS });
});

export default router;
