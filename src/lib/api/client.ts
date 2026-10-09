import axios from 'axios';

const getBaseUrl = () => {
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL;
  }
  if (
    typeof window !== 'undefined' &&
    ((window as any).__TAURI_INTERNALS__ ||
      (window as any).__TAURI__ ||
      window.location.protocol === 'tauri:' ||
      window.location.protocol === 'asset:' ||
      window.location.hostname === 'tauri.localhost' ||
      window.location.origin.includes('tauri') ||
      window.location.port !== '1420')
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

// Automatically inject desktop session token on all outgoing requests
apiClient.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      config.headers['X-Auth-Token'] = token;
    }
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // If 401 Unauthorized and not on login page, clear token
    if (error.response && error.response.status === 401) {
      if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
        localStorage.removeItem('auth_token');
      }
    }
    return Promise.reject(error);
  }
);
