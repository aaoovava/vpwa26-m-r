import { defineBoot } from '#q-app';
import axios, { type AxiosInstance } from 'axios';

export const TOKEN_STORAGE_KEY = 'vpwa-token';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:3333',
  timeout: 15_000,
  headers: { Accept: 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_STORAGE_KEY);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Preserve readable API errors for the existing form and channel error messages.
api.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    if (axios.isAxiosError<{ message?: string }>(error)) {
      const message = error.response?.data?.message;
      if (typeof message === 'string') {
        error.message = message;
      } else if (!error.response) {
        error.message = 'Cannot reach the server. Check that the backend is running and try again.';
      }
    }
    return Promise.reject(error instanceof Error ? error : new Error('Request failed.'));
  },
);

declare module 'vue' {
  interface ComponentCustomProperties {
    $api: AxiosInstance;
  }
}

export default defineBoot(({ app }) => {
  app.config.globalProperties.$api = api;
});

export { api };
