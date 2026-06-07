import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';

export type UserRole = 'admin' | 'member' | 'viewer';

interface User {
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
}

const initialState: AuthState = {
  user: null,
  token: localStorage.getItem('auth_token'),
  isAuthenticated: !!localStorage.getItem('auth_token'),
  loading: false,
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

      localStorage.setItem('auth_token', action.payload.token);
    },

    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },

    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.loading = false;

      localStorage.removeItem('auth_token');
      localStorage.removeItem('refresh_token');
    },
  },
});

// ---------------------------------------------------------------------------
// ACTIONS
// ---------------------------------------------------------------------------
export const { setCredentials, setLoading, logout } = authSlice.actions;

// ---------------------------------------------------------------------------
// SELECTORS (FIX FOR YOUR AppRoutes.tsx ERROR)
// ---------------------------------------------------------------------------
export interface RootState {
  auth: AuthState;
}

export const selectAuth = (state: RootState) => state.auth;

export const selectIsAuthenticated = (state: RootState) =>
  state.auth.isAuthenticated;

export const selectAuthLoading = (state: RootState) =>
  state.auth.loading;

// ---------------------------------------------------------------------------
// REDUCER
// ---------------------------------------------------------------------------
export default authSlice.reducer;