import { Router } from 'express';
import { verifyAccessToken } from '../middleware/auth.middleware.js';
import * as ctrl from '../controllers/helpTicket.controller.js';

const router = Router();
router.use(verifyAccessToken);

router.post('/', ctrl.createTicket);
router.get('/faculty', ctrl.getFaculty);
router.get('/', ctrl.getTickets);
router.patch('/:id/respond', ctrl.respondToTicket);
router.patch('/:id/resolve', ctrl.resolveTicket);
router.post('/:id/ai-draft', ctrl.generateAIDraft);

export default router;
