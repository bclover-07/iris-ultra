import { Router } from 'express';
import { verifyAccessToken } from '../middleware/auth.middleware.js';
import { createRoom, getRooms, getRoomById, deleteRoom, getMyStats } from '../controllers/world.controller.js';

const router = Router();
router.use(verifyAccessToken);

router.post('/rooms', createRoom);
router.get('/rooms', getRooms);
router.get('/rooms/:roomId', getRoomById);
router.delete('/rooms/:roomId', deleteRoom);
router.get('/sessions/my-stats', getMyStats);

export default router;
