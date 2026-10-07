import axios from 'axios';

const getBaseUrl = () => {
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL;
  }
  if (
    typeof window !== 'undefined' &&
    (window.location.protocol === 'tauri:' ||
      window.location.hostname === 'tauri.localhost' ||
      window.location.origin.includes('tauri'))
  ) {
    return 'http://127.0.0.1:4000/api';
  }
  return '/api';
};

export const apiClient = axios.create({
  baseURL: getBaseUrl(),
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // If 401 Unauthorized and not on login page, redirect or broadcast
    if (error.response && error.response.status === 401) {
      if (window.location.pathname !== '/login') {
        // Session expired or logged out
      }
    }
    return Promise.reject(error);
  }
);
