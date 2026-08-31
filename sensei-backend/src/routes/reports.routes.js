import { Router } from 'express';
import { verifyAccessToken } from '../middleware/auth.middleware.js';
import * as ctrl from '../controllers/reports.controller.js';

const router = Router();
router.use(verifyAccessToken);

router.get('/', ctrl.getReports);
router.post('/generate', ctrl.generateReport);

export default router;
