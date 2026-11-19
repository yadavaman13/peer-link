import { apiClient } from '../../shared/api/client.js';

export const systemService = {
  async getHealth() {
    const response = await apiClient.get('/api/system/health');
    return response.data;
  },
};
