import { Router } from 'express';
import { verifyAccessToken } from '../middleware/auth.middleware.js';
import { simulateCareer, getMarketData, getCareerHistory } from '../controllers/career.controller.js';

const router = Router();
router.use(verifyAccessToken);

router.post('/simulate', simulateCareer);
router.get('/market-data', getMarketData);
router.get('/history', getCareerHistory);

export default router;
