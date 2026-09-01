import { Router } from 'express';
import { verifyAccessToken } from '../middleware/auth.middleware.js';
import { getQuizBank, submitQuizAttempt, getQuizHistory } from '../controllers/quiz.controller.js';

const router = Router();
router.use(verifyAccessToken);

router.get('/bank/:topic?', getQuizBank);
router.post('/attempt', submitQuizAttempt);
router.get('/history', getQuizHistory);

export default router;
