import { apiClient } from './client';
import { User, LoginResponse } from '@/types/entities';

export const authApi = {
  login: async (credentials: { username: string; password: string }) => {
    const res = await apiClient.post<LoginResponse>('/auth/login', credentials);
    if (res.data?.token && typeof window !== 'undefined') {
      localStorage.setItem('auth_token', res.data.token);
    }
    return res.data;
  },

  logout: async () => {
    try {
      const res = await apiClient.post<{ success: boolean }>('/auth/logout');
      return res.data;
    } finally {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('auth_token');
      }
    }
  },

  getSession: async () => {
    const res = await apiClient.get<{ success: boolean; user: User | null }>('/auth/session');
    return res.data;
  },

  changePassword: async (passwords: { oldPassword: string; newPassword: string }) => {
    const res = await apiClient.post<{ success: boolean; message: string }>('/auth/change-password', passwords);
    return res.data;
  },
};
