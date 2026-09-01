import { Router } from 'express';
import { verifyAccessToken } from '../middleware/auth.middleware.js';
import { mentorChat, getChatHistory, clearChatHistory } from '../controllers/mentor.controller.js';

const router = Router();
router.use(verifyAccessToken);

router.post('/chat', mentorChat);
router.get('/history', getChatHistory);
router.delete('/history', clearChatHistory);

export default router;
