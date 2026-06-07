import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
export * from './authThunks';

export type UserRole = 'admin' | 'member' | 'viewer';

export interface User {
  id: string;
  email: string;
  role: UserRole;
  name?: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
}

const token = localStorage.getItem('auth_token');

const initialState: AuthState = {
  user: null,
  token,
  isAuthenticated: !!token,
  loading: false,
  error: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (
      state,
      action: PayloadAction<{ user: User; token: string }>
    ) => {
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.isAuthenticated = true;
      state.loading = false;
      state.error = null;

      localStorage.setItem('auth_token', action.payload.token);
    },

    clearError: (state) => {
      state.error = null;
    },

    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },

    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
      state.loading = false;
    },

    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.loading = false;
      state.error = null;

      localStorage.removeItem('auth_token');
      localStorage.removeItem('refresh_token');
    },
  },
});

// ---------------------------------------------------------------------------
// ACTIONS
// ---------------------------------------------------------------------------
export const {
  setCredentials,
  setLoading,
  setError,
  clearError,
  logout,   // ✅ FIXED: THIS WAS MISSING
} = authSlice.actions;

// ---------------------------------------------------------------------------
// SELECTORS
// ---------------------------------------------------------------------------
export const selectAuth = (state: { auth: AuthState }) => state.auth;

export const selectIsAuthenticated = (state: { auth: AuthState }) =>
  state.auth.isAuthenticated;

export const selectAuthLoading = (state: { auth: AuthState }) =>
  state.auth.loading;

export const selectAuthError = (state: { auth: AuthState }) =>
  state.auth.error;

export const selectAuthToken = (state: { auth: AuthState }) =>
  state.auth.token;

export const selectCurrentUser = (state: { auth: AuthState }) =>
  state.auth.user;

// ---------------------------------------------------------------------------
// REDUCER
// ---------------------------------------------------------------------------
export default authSlice.reducer;