import { Router } from 'express';
import { verifyAccessToken } from '../middleware/auth.middleware.js';
import { startInterview, scoreAnswer, finalizeInterview, getInterviewHistory } from '../controllers/interview.controller.js';

const router = Router();
router.use(verifyAccessToken);

router.post('/start', startInterview);
router.post('/score-answer', scoreAnswer);
router.post('/finalize', finalizeInterview);
router.get('/history', getInterviewHistory);

export default router;
