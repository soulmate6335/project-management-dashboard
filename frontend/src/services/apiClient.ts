// src/services/apiClient.ts [FRONTEND]
import axios from 'axios';
import type { AxiosInstance, AxiosResponse, InternalAxiosRequestConfig } from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL;

if (!BASE_URL) {
  throw new Error('[apiClient] VITE_API_URL is not defined.');
}

// ---------------------------------------------------------------------------
// Instance
// ---------------------------------------------------------------------------
export const apiClient: AxiosInstance = axios.create({
  baseURL: `${BASE_URL}/api/v1`,
  timeout: 15_000,
  headers: {
    'Content-Type': 'application/json',
    Accept:         'application/json',
  },
});

// ---------------------------------------------------------------------------
// Request interceptor — attach JWT token to every request
// ---------------------------------------------------------------------------
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('auth_token');
    console.log('[apiClient] Token from storage:', token ? 'EXISTS' : 'MISSING');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
      console.log('[apiClient] Authorization header set');
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ---------------------------------------------------------------------------
// Response interceptor — handle 401
// ---------------------------------------------------------------------------
apiClient.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error) => {
    const originalRequest = error.config;

    if (
      error.response?.status === 401 &&
      !originalRequest._retried &&
      localStorage.getItem('refresh_token')
    ) {
      originalRequest._retried = true;

      try {
        const refreshToken = localStorage.getItem('refresh_token');
        const { data } = await axios.post(
          `${BASE_URL}/api/v1/auth/refresh`,
          { refreshToken }
        );

        const newToken = data.data?.accessToken ?? data.data?.token;
        if (newToken) {
          localStorage.setItem('auth_token', newToken);
          originalRequest.headers['Authorization'] = `Bearer ${newToken}`;
          return apiClient(originalRequest);
        }
      } catch {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('refresh_token');
        window.dispatchEvent(new Event('auth:logout'));
      }
    }

    return Promise.reject(error);
  }
);

// ---------------------------------------------------------------------------
// Unwrap helper
// ---------------------------------------------------------------------------
export function unwrap<T>(response: AxiosResponse<{ data: T }>): T {
  return response.data.data;
}

export default apiClient;