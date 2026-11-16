import { Router } from 'express';
import { RoomController } from './room.controller.js';
import { validateRoomId, validateCreateRoom } from './room.validators.js';

const router = Router();

router.post('/', validateCreateRoom, RoomController.create);
router.get('/', RoomController.list);
router.get('/:id', validateRoomId, RoomController.getById);

export default router;
