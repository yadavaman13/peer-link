import { Router } from 'express';
import { RoomController } from './room.controller.js';
import { validateRoomId, validateCreateRoom } from './room.validators.js';
import { protect } from '../auth/middleware/auth.middleware.js';

const router = Router();

// Route protection: Auth is required for all users before accessing room features
router.use(protect);

router.post('/', validateCreateRoom, RoomController.create);
router.get('/', RoomController.list);
router.get('/:id', validateRoomId, RoomController.getById);

export default router;
