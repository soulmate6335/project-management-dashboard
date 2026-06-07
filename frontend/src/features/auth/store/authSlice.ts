// src/features/auth/store/authSlice.ts [FRONTEND]
import { createSlice }   from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '../../../store/store';
import { loginUser, registerUser } from './authThunks';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export interface User {
  id:      string;
  name:    string;
  email:   string;
  role:    'admin' | 'member' | 'viewer';
  avatar?: string | null;
}

interface AuthState {
  user:    User | null;
  token:   string | null;
  loading: boolean;
  error:   string | null;
}

// ---------------------------------------------------------------------------
// Initial state
// ---------------------------------------------------------------------------
const storedToken = localStorage.getItem('auth_token');

const initialState: AuthState = {
  user:    null,
  token:   storedToken,
  loading: Boolean(storedToken),
  error:   null,
};

// ---------------------------------------------------------------------------
// Slice
// ---------------------------------------------------------------------------
const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout(state) {
      state.user    = null;
      state.token   = null;
      state.loading = false;
      state.error   = null;
      localStorage.removeItem('auth_token');
      localStorage.removeItem('refresh_token');
    },
    clearError(state) {
      state.error = null;
    },
    setCredentials(
      state,
      action: PayloadAction<{ user: User; token: string }>
    ) {
      state.user    = action.payload.user;
      state.token   = action.payload.token;
      state.loading = false;
      state.error   = null;
    },
    setLoading(state, action: PayloadAction<boolean>) {
      state.loading = action.payload;
    },
    setError(state, action: PayloadAction<string>) {
      state.error   = action.payload;
      state.loading = false;
    },
    // Called on app boot when token exists — marks rehydration complete
    rehydrateUser(state, action: PayloadAction<User>) {
      state.user    = action.payload;
      state.loading = false;
    },
    rehydrateFailed(state) {
      state.user    = null;
      state.token   = null;
      state.loading = false;
      localStorage.removeItem('auth_token');
      localStorage.removeItem('refresh_token');
    },
  },
  extraReducers: (builder) => {
    // ── loginUser ──────────────────────────────────────────────────────
    builder
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error   = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user    = action.payload.user;
        state.token   = action.payload.token;
        state.error   = null;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error   = action.payload as string;
      });

    // ── registerUser ───────────────────────────────────────────────────
    builder
      .addCase(registerUser.pending, (state) => {
        state.loading = true;
        state.error   = null;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user    = action.payload.user;
        state.token   = action.payload.token;
        state.error   = null;
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.loading = false;
        state.error   = action.payload as string;
      });
  },
});

// ---------------------------------------------------------------------------
// Actions
// ---------------------------------------------------------------------------
export const {
  logout,
  clearError,
  setCredentials,
  setLoading,
  setError,
  rehydrateUser,
  rehydrateFailed,
} = authSlice.actions;

// Re-export thunks so files can import loginUser from authSlice
export { loginUser, registerUser } from './authThunks';

// ---------------------------------------------------------------------------
// Selectors
// ---------------------------------------------------------------------------
export const selectIsAuthenticated = (state: RootState): boolean =>
  Boolean(state.auth.token && state.auth.user);

export const selectAuthLoading = (state: RootState): boolean =>
  state.auth.loading;

export const selectCurrentUser = (state: RootState): User | null =>
  state.auth.user;

export const selectAuthError = (state: RootState): string | null =>
  state.auth.error;

export const selectAuthToken = (state: RootState): string | null =>
  state.auth.token;

export default authSlice.reducer;