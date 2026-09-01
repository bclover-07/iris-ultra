import { Router } from 'express';
import { verifyAccessToken } from '../middleware/auth.middleware.js';
import { getLeaderboard } from '../controllers/leaderboard.controller.js';

const router = Router();
router.use(verifyAccessToken);

router.get('/', getLeaderboard);

export default router;
