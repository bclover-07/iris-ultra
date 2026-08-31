import { Router } from 'express';
import { verifyAccessToken } from '../middleware/auth.middleware.js';
import { requireRole } from '../middleware/role.middleware.js';
import * as ctrl from '../controllers/student.controller.js';

const router = Router();

router.use(verifyAccessToken, requireRole('student'));

router.get('/dashboard', ctrl.getDashboard);
router.get('/marks-trend', ctrl.getMarksTrend);
router.get('/radar', ctrl.getRadar);
router.get('/attendance', ctrl.getAttendance);
router.get('/insights', ctrl.getInsights);
router.get('/timeline', ctrl.getTimeline);
router.get('/profile', ctrl.getProfile);
router.patch('/profile', ctrl.updateProfile);
router.get('/notifications', ctrl.getNotifications);
router.patch('/notifications/:id/read', ctrl.markNotificationRead);
router.get('/interventions', ctrl.getInterventions);
router.get('/leaderboard', ctrl.getLeaderboard);
router.post('/add-xp', ctrl.addXP);

export default router;
