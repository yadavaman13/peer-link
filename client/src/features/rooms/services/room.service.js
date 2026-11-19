import { apiClient } from '../../shared/api/client.js';

export const roomService = {
  async list() {
    const response = await apiClient.get('/api/rooms');
    return response.data;
  },

  async create(data = {}) {
    const response = await apiClient.post('/api/rooms', data);
    return response.data;
  },

  async getById(roomId) {
    const response = await apiClient.get(`/api/rooms/${roomId}`);
    return response.data;
  },
};
