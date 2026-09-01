import { Router } from 'express';
import { verifyAccessToken } from '../middleware/auth.middleware.js';
import { getDashboard, syncVerifiedSignal, getProfile, updateProfile } from '../controllers/student.controller.js';

const router = Router();
router.use(verifyAccessToken);

router.get('/dashboard', getDashboard);
router.post('/sync-verified-signal', syncVerifiedSignal);
router.post('/profile/sync', syncVerifiedSignal);
router.get('/profile', getProfile);
router.put('/profile', updateProfile);

export default router;
