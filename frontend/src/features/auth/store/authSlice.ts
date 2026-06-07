// src/features/auth/store/authSlice.ts [FRONTEND]
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { PayloadAction }            from '@reduxjs/toolkit';
import type { RootState }                from '../../../store/store';
import authService                       from '../../../services/authService';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export interface User {
  id:      string;
  name:    string;
  email:   string;
  role:    'admin' | 'member' | 'viewer';
  avatar?: string;
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
// Thunks
// ---------------------------------------------------------------------------
export const loginUser = createAsyncThunk(
  'auth/login',
  async (
    credentials: { email: string; password: string },
    { rejectWithValue }
  ) => {
    try {
      return await authService.login(credentials);
    } catch (err: unknown) {
      let message = 'Login failed';
      if (typeof err === 'object' && err !== null && 'response' in err) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const e = err as any;
        message = e.response?.data?.message ?? message;
      }
      return rejectWithValue(message);
    }
  }
);

export const registerUser = createAsyncThunk(
  'auth/register',
  async (
    payload: { name: string; email: string; password: string },
    { rejectWithValue }
  ) => {
    try {
      return await authService.register(payload);
    } catch (err: unknown) {
      let message = 'Registration failed';
      if (typeof err === 'object' && err !== null && 'response' in err) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const e = err as any;
        message = e.response?.data?.message ?? message;
      }
      return rejectWithValue(message);
    }
  }
);

export const rehydrateAuth = createAsyncThunk(
  'auth/rehydrate',
  async (_, { rejectWithValue }) => {
    try {
      return await authService.getCurrentUser();
    } catch {
      return rejectWithValue('Token invalid');
    }
  }
);

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
      state.user  = action.payload.user;
      state.token = action.payload.token;
      localStorage.setItem('auth_token', action.payload.token);
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
        state.user    = action.payload.user as User;
        state.token   = action.payload.token;
        localStorage.setItem('auth_token', action.payload.token);
        if (action.payload.refreshToken) {
          localStorage.setItem('refresh_token', action.payload.refreshToken);
        }
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
        state.user    = action.payload.user as User;
        state.token   = action.payload.token;
        localStorage.setItem('auth_token', action.payload.token);
        if (action.payload.refreshToken) {
          localStorage.setItem('refresh_token', action.payload.refreshToken);
        }
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.loading = false;
        state.error   = action.payload as string;
      });

    // ── rehydrateAuth ──────────────────────────────────────────────────
    builder
      .addCase(rehydrateAuth.pending, (state) => {
        state.loading = true;
      })
      .addCase(rehydrateAuth.fulfilled, (state, action) => {
        state.loading = false;
        state.user    = action.payload as User;
      })
      .addCase(rehydrateAuth.rejected, (state) => {
        state.loading = false;
        state.user    = null;
        state.token   = null;
        localStorage.removeItem('auth_token');
        localStorage.removeItem('refresh_token');
      });
  },
});

// ---------------------------------------------------------------------------
// Actions
// ---------------------------------------------------------------------------
export const { logout, clearError, setCredentials } = authSlice.actions;

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