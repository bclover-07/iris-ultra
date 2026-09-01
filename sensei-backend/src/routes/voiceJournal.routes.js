import { Router } from 'express';
import { verifyAccessToken } from '../middleware/auth.middleware.js';
import { logVoiceEntry, getVoiceEntries, getVoiceTrend } from '../controllers/voiceJournal.controller.js';

const router = Router();
router.use(verifyAccessToken);

router.post('/entry', logVoiceEntry);
router.get('/entries', getVoiceEntries);
router.get('/trend', getVoiceTrend);

export default router;
