import { v4 as uuidv4 } from 'uuid';
import { Room } from '../modules/room/Room.js';
import { WorkerService, RouterService } from './mediasoup/index.js';
import { logger } from '../shared/logger.js';

const rooms = new Map();

export const RoomService = {
  async create() {
    const id = uuidv4();
    const router = await RouterService.create(WorkerService.get());
    const room = new Room(id, router);
    rooms.set(id, room);
    logger.info(`Room created [${id}]`);
    return room;
  },

  get(roomId) {
    return rooms.get(roomId) || null;
  },

  delete(roomId) {
    const room = rooms.get(roomId);
    if (room) {
      room.close();
      rooms.delete(roomId);
      logger.info(`Room deleted [${roomId}]`);
    }
  },

  exists(roomId) {
    return rooms.has(roomId);
  },

  count() {
    return rooms.size;
  },

  listAll() {
    return Array.from(rooms.values()).map((r) => ({
      roomId: r.id,
      participants: r.size,
      createdAt: r.createdAt,
    }));
  },

  clearAll() {
    for (const room of rooms.values()) {
      room.close();
    }
    rooms.clear();
  },
};
