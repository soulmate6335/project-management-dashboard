// src/services/authService.ts [FRONTEND]
import { apiClient } from './apiClient';

export interface LoginCredentials {
  email:    string;
  password: string;
}

export interface RegisterPayload {
  name:     string;
  email:    string;
  password: string;
}

export interface AuthResponse {
  user: {
    id:    string;
    name:  string;
    email: string;
    role:  string;
  };
  token:        string;
  refreshToken: string;
}

async function login(credentials: LoginCredentials): Promise<AuthResponse> {
  const response = await apiClient.post('/auth/login', credentials);
  return response.data.data;
}

async function register(payload: RegisterPayload): Promise<AuthResponse> {
  const response = await apiClient.post('/auth/register', payload);
  return response.data.data;
}

async function getCurrentUser(): Promise<AuthResponse['user']> {
  const response = await apiClient.get('/auth/me');
  return response.data.data;
}

async function refreshToken(token: string): Promise<{ token: string }> {
  const response = await apiClient.post('/auth/refresh', { refreshToken: token });
  return response.data.data;
}

const authService = { login, register, getCurrentUser, refreshToken };
export default authService;