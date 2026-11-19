import { RoomService } from '../../src/services/room.service.js';

describe('RoomService', () => {
  beforeEach(() => {
    RoomService.clearAll();
  });

  it('creates a room with an id, router, and empty participants', async () => {
    const room = await RoomService.create();
    expect(room).toBeDefined();
    expect(room.id).toBeDefined();
    expect(room.router).toBeDefined();
    expect(room.size).toBe(0);
    expect(room.isEmpty).toBe(true);
  });

  it('gets a room by ID', async () => {
    const created = await RoomService.create();
    const fetched = RoomService.get(created.id);
    expect(fetched).toBe(created);
  });

  it('returns null for non-existent room', () => {
    const fetched = RoomService.get('non-existent-id');
    expect(fetched).toBeNull();
  });

  it('deletes a room and closes resources', async () => {
    const created = await RoomService.create();
    expect(RoomService.exists(created.id)).toBe(true);

    RoomService.delete(created.id);
    expect(RoomService.exists(created.id)).toBe(false);
    expect(RoomService.get(created.id)).toBeNull();
  });

  it('lists all active rooms', async () => {
    const room1 = await RoomService.create();
    const room2 = await RoomService.create();

    const list = RoomService.listAll();
    expect(list.length).toBe(2);
    expect(list.map((r) => r.roomId)).toContain(room1.id);
    expect(list.map((r) => r.roomId)).toContain(room2.id);
  });
});
