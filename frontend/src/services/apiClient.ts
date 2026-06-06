// src/services/apiClient.ts
//
// Shared Axios instance used by all services.
// Handles: base URL, auth token injection, token refresh on 401,
// and response unwrapping so services receive data directly.

import axios from 'axios';
import type {
  AxiosInstance,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from 'axios';
import type { ApiSuccess } from '../types/index';

const BASE_URL = import.meta.env.VITE_API_URL;

if (!BASE_URL) {
  throw new Error(
    '[apiClient] VITE_API_URL is not defined. Add it to your .env file.'
  );
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
// Request interceptor — attach JWT
// ---------------------------------------------------------------------------
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('auth_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ---------------------------------------------------------------------------
// Response interceptor — unwrap envelope + handle 401
// ---------------------------------------------------------------------------
apiClient.interceptors.response.use(
  (response: AxiosResponse<ApiSuccess<unknown>>) => response,
  async (error) => {
    const originalRequest = error.config;

    // Token expired — attempt one silent refresh then retry
    if (
      error.response?.status === 401 &&
      !originalRequest._retried &&
      localStorage.getItem('auth_token')
    ) {
      originalRequest._retried = true;

      try {
        const refreshToken = localStorage.getItem('refresh_token');
        const { data } = await axios.post(`${BASE_URL}/api/v1/auth/refresh`, {
          refreshToken,
        });

        const newToken = data.data?.token;
        if (newToken) {
          localStorage.setItem('auth_token', newToken);
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return apiClient(originalRequest);
        }
      } catch {
        // Refresh failed — clear storage and let the Redux auth guard handle redirect
        localStorage.removeItem('auth_token');
        localStorage.removeItem('refresh_token');
        window.dispatchEvent(new Event('auth:logout'));
      }
    }

    return Promise.reject(error);
  }
);

// ---------------------------------------------------------------------------
// Convenience extractor — unwraps { success, data } envelope
// ---------------------------------------------------------------------------
export function unwrap<T>(response: AxiosResponse<ApiSuccess<T>>): T {
  return response.data.data;
}