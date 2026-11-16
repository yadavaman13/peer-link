import { Router } from 'express';
import { SystemController } from './system.controller.js';

const router = Router();
router.get('/health', SystemController.health);
export default router;
