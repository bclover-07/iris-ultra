import { Router } from 'express';
import { verifyAccessToken } from '../middleware/auth.middleware.js';
import {
  register,
  login,
  logout,
  getMe,
  refreshToken,
  changePassword,
  forgotPassword,
  resetPassword
} from '../controllers/auth.controller.js';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/logout', logout);
router.post('/refresh', refreshToken);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password/:token', resetPassword);

router.get('/me', verifyAccessToken, getMe);
router.post('/change-password', verifyAccessToken, changePassword);

export default router;
