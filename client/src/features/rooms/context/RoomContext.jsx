import React, { createContext, useState, useEffect, useCallback } from 'react';
import { roomService } from '../services/room.service.js';

const RoomContext = createContext(null);

export function RoomProvider({ children }) {
  const [rooms, setRooms] = useState([]);
  const [count, setCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const fetchRooms = useCallback(async () => {
    try {
      const data = await roomService.list();
      setRooms(data.rooms || []);
      setCount(data.count || 0);
    } catch {
      // Ignore background fetch error
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRooms();
    const interval = setInterval(fetchRooms, 15000);
    return () => clearInterval(interval);
  }, [fetchRooms]);

  const createRoom = useCallback(
    async (options = {}) => {
      const data = await roomService.create(options);
      await fetchRooms();
      return data;
    },
    [fetchRooms]
  );

  return (
    <RoomContext.Provider value={{ rooms, count, isLoading, fetchRooms, createRoom }}>
      {children}
    </RoomContext.Provider>
  );
}

export { RoomContext };
