import { Router } from 'express';
import { verifyAccessToken } from '../middleware/auth.middleware.js';
import { generatePlan, getActivePlan, toggleTask } from '../controllers/studyPlan.controller.js';

const router = Router();
router.use(verifyAccessToken);

router.post('/generate', generatePlan);
router.get('/active', getActivePlan);
router.patch('/toggle-task', toggleTask);

export default router;
