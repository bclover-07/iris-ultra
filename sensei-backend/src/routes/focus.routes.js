import { Router } from 'express';
import { verifyAccessToken } from '../middleware/auth.middleware.js';
import { logFocusSession, getFocusHistory } from '../controllers/focus.controller.js';

const router = Router();
router.use(verifyAccessToken);

router.post('/session', logFocusSession);
router.post('/log', logFocusSession);
router.get('/history', getFocusHistory);

export default router;
