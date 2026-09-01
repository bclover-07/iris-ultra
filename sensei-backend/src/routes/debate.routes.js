import { Router } from 'express';
import { verifyAccessToken } from '../middleware/auth.middleware.js';
import { getDebateTopics, scoreDebateTranscript, getDebateHistory } from '../controllers/debate.controller.js';

const router = Router();
router.use(verifyAccessToken);

router.get('/topics', getDebateTopics);
router.post('/score-transcript', scoreDebateTranscript);
router.get('/history', getDebateHistory);

export default router;
