import { Router } from 'express';
import { verifyAccessToken } from '../middleware/auth.middleware.js';
import { solveDoubt, getDoubtHistory } from '../controllers/doubt.controller.js';

const router = Router();
router.use(verifyAccessToken);

router.post('/solve', solveDoubt);
router.get('/history', getDoubtHistory);

export default router;
