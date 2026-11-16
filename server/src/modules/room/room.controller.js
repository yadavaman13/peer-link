import { RoomService } from '../../services/room.service.js';
import { asyncHandler } from '../../shared/asyncHandler.js';
import { AppError } from '../../shared/AppError.js';

export const RoomController = {
  create: asyncHandler(async (req, res) => {
    const room = await RoomService.create();
    res.status(201).json({ roomId: room.id, createdAt: room.createdAt });
  }),

  getById: asyncHandler(async (req, res) => {
    const room = RoomService.get(req.params.id);
    if (!room) throw AppError.notFound('Room not found');
    res.json({
      roomId: room.id,
      participants: room.size,
      createdAt: room.createdAt,
    });
  }),

  list: asyncHandler(async (req, res) => {
    const rooms = RoomService.listAll();
    res.json({ count: rooms.length, rooms });
  }),
};
