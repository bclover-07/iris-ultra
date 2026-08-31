import axios from 'axios';
import { useAuthStore } from '../stores/authStore';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

const api = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' }
});

api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const dynamicBaseUrl = process.env.NEXT_PUBLIC_API_URL || `${window.location.protocol}//${window.location.hostname}:5000`;
    config.baseURL = dynamicBaseUrl;
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

let isRefreshing = false;
let failedQueue: Array<{ resolve: (v: unknown) => void; reject: (e: unknown) => void }> = [];

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error);
    else resolve(token);
  });
  failedQueue = [];
};

const forceLogout = () => {
  localStorage.removeItem('accessToken');
  try { useAuthStore.getState().logout(); } catch (e) { /* store may not be initialized */ }
  if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
    window.location.href = '/login';
  }
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (originalRequest?.url?.includes('/auth/login') || originalRequest?.url?.includes('/auth/refresh')) {
      return Promise.reject(error);
    }

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        }).catch(() => {
          forceLogout();
          return Promise.reject(error);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const dynamicBaseUrl = typeof window !== 'undefined'
          ? (process.env.NEXT_PUBLIC_API_URL || `${window.location.protocol}//${window.location.hostname}:5000`)
          : API_BASE;
        const { data } = await axios.post(
          `${dynamicBaseUrl}/api/auth/refresh`,
          {},
          { withCredentials: true }
        );

        localStorage.setItem('accessToken', data.accessToken);
        originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
        processQueue(null, data.accessToken);
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        forceLogout();
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default api;
