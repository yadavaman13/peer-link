import { apiClient } from '../../shared/api/client.js';

export const authService = {
  async sendVerificationOtp({ email }) {
    const response = await apiClient.post('/api/auth/send-verification-otp', {
      email,
    });
    return response.data;
  },

  async verifyEmail({ email, otp }) {
    const response = await apiClient.post('/api/auth/verify-email', {
      email,
      otp,
    });
    return response.data;
  },

  async resendOtp({ email, purpose = 'verify_email' }) {
    const response = await apiClient.post('/api/auth/resend-otp', {
      email,
      purpose,
    });
    return response.data;
  },

  async register({ firstName, lastName, email, password }) {
    const response = await apiClient.post('/api/auth/register', {
      firstName,
      lastName,
      email,
      password,
    });
    return response.data;
  },

  async login({ email, password }) {
    const response = await apiClient.post('/api/auth/login', {
      email,
      password,
    });
    return response.data;
  },

  async getMe() {
    const response = await apiClient.get('/api/users/get-me');
    return response.data;
  },

  async updateProfile({ firstName, lastName }) {
    const response = await apiClient.patch('/api/users/profile', {
      firstName,
      lastName,
    });
    return response.data;
  },

  async logout() {
    const response = await apiClient.post('/api/auth/logout');
    return response.data;
  },
};
