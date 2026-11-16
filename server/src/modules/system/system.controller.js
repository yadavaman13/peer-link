import { WorkerService } from '../../services/mediasoup/index.js';
import { RoomService } from '../../services/room.service.js';
import { asyncHandler } from '../../shared/asyncHandler.js';

const startTime = Date.now();

export const SystemController = {
  health: asyncHandler(async (req, res) => {
    const workerStats = await WorkerService.getStats();
    res.json({
      status: 'ok',
      uptime: Math.floor((Date.now() - startTime) / 1000),
      activeRooms: RoomService.count(),
      worker: workerStats,
    });
  }),
};
