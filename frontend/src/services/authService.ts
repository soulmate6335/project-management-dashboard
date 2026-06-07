// src/services/authService.ts [FRONTEND]
import { apiClient } from './apiClient';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export interface LoginCredentials {
  email:    string;
  password: string;
}

export interface RegisterPayload {
  name:     string;
  email:    string;
  password: string;
}

export interface AuthUser {
  _id?:    string;
  id?:     string;
  name:    string;
  email:   string;
  role:    string;
  avatar?: string | null;
}

export interface AuthResponse {
  user:          AuthUser;
  token:         string;
  refreshToken?: string;
}

// ---------------------------------------------------------------------------
// Service functions
// ---------------------------------------------------------------------------
async function login(credentials: LoginCredentials): Promise<AuthResponse> {
  const response = await apiClient.post('/auth/login', credentials);
  const data     = response.data.data;

  // Backend returns accessToken — map it to token
  return {
    user:         data.user,
    token:        data.accessToken ?? data.token,
    refreshToken: data.refreshToken,
  };
}

async function register(payload: RegisterPayload): Promise<AuthResponse> {
  const response = await apiClient.post('/auth/register', payload);
  const data     = response.data.data;

  // Backend returns accessToken — map it to token
  return {
    user:         data.user,
    token:        data.accessToken ?? data.token,
    refreshToken: data.refreshToken,
  };
}

async function getCurrentUser(): Promise<AuthUser> {
  const response = await apiClient.get('/auth/me');
  return response.data.data;
}

async function refreshToken(token: string): Promise<{ token: string }> {
  const response = await apiClient.post('/auth/refresh', { refreshToken: token });
  const data     = response.data.data;
  return { token: data.accessToken ?? data.token };
}

const authService = { login, register, getCurrentUser, refreshToken };
export default authService;