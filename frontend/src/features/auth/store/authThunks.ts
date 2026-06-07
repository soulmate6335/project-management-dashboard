// src/features/auth/store/authThunks.ts [FRONTEND]
import { createAsyncThunk } from '@reduxjs/toolkit';
import { apiClient }        from '../../../services/apiClient';
import { setCredentials }   from './authSlice';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function normaliseUser(user: Record<string, unknown>) {
  return {
    id:     (user._id ?? user.id ?? '') as string,
    name:   user.name as string,
    email:  user.email as string,
    role:   (user.role ?? 'member') as 'admin' | 'member' | 'viewer',
    avatar: (user.avatar ?? null) as string | null,
  };
}

function extractToken(data: Record<string, unknown>): string {
  // Backend returns accessToken — fall back to token if ever changed
  return (data.accessToken ?? data.token ?? '') as string;
}

// ---------------------------------------------------------------------------
// LOGIN
// ---------------------------------------------------------------------------
export const loginUser = createAsyncThunk(
  'auth/loginUser',
  async (
    credentials: { email: string; password: string },
    { dispatch, rejectWithValue }
  ) => {
    try {
      const res  = await apiClient.post('/auth/login', credentials);
      const data = res.data.data as Record<string, unknown>;

      const user  = normaliseUser(data.user as Record<string, unknown>);
      const token = extractToken(data);

      // Save to localStorage
      localStorage.setItem('auth_token', token);
      if (data.refreshToken) {
        localStorage.setItem('refresh_token', data.refreshToken as string);
      }

      dispatch(setCredentials({ user, token }));
      return { user, token };
    } catch (err: unknown) {
      const apiError = err as { response?: { data?: { message?: string } } };
      return rejectWithValue(apiError.response?.data?.message ?? 'Login failed');
    }
  }
);

// ---------------------------------------------------------------------------
// REGISTER
// ---------------------------------------------------------------------------
export const registerUser = createAsyncThunk(
  'auth/registerUser',
  async (
    payload: { name: string; email: string; password: string },
    { dispatch, rejectWithValue }
  ) => {
    try {
      const res  = await apiClient.post('/auth/register', payload);
      const data = res.data.data as Record<string, unknown>;

      const user  = normaliseUser(data.user as Record<string, unknown>);
      const token = extractToken(data);

      // Save to localStorage
      localStorage.setItem('auth_token', token);
      if (data.refreshToken) {
        localStorage.setItem('refresh_token', data.refreshToken as string);
      }

      dispatch(setCredentials({ user, token }));
      return { user, token };
    } catch (err: unknown) {
      const apiError = err as { response?: { data?: { message?: string } } };
      return rejectWithValue(apiError.response?.data?.message ?? 'Registration failed');
    }
  }
);