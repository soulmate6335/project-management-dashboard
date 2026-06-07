// src/features/auth/store/authSlice.ts [FRONTEND]
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { PayloadAction }            from '@reduxjs/toolkit';
import type { RootState }                from '../../../store/store';
import authService                       from '../../../services/authService';
import type { AuthResponse, AuthUser }   from '../../../services/authService';

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
// Helpers
// ---------------------------------------------------------------------------

// Backend returns _id — normalise to id for consistent use across the frontend
function normaliseUser(user: AuthUser): User {
  return {
    id:     user._id ?? user.id ?? '',
    name:   user.name,
    email:  user.email,
    role:   (user.role as User['role']) ?? 'member',
    avatar: user.avatar ?? null,
  };
}

function saveTokens(token: string, refreshToken?: string): void {
  localStorage.setItem('auth_token', token);
  if (refreshToken) {
    localStorage.setItem('refresh_token', refreshToken);
  }
}

function clearTokens(): void {
  localStorage.removeItem('auth_token');
  localStorage.removeItem('refresh_token');
}

// ---------------------------------------------------------------------------
// Initial state
// ---------------------------------------------------------------------------
const storedToken = localStorage.getItem('auth_token');

const initialState: AuthState = {
  user:    null,
  token:   storedToken,
  loading: Boolean(storedToken), // true = still rehydrating from storage
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
      const error = err as { response?: { data?: { message?: string } } };
      return rejectWithValue(
        error.response?.data?.message ?? 'Login failed'
      );
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
      const error = err as { response?: { data?: { message?: string } } };
      return rejectWithValue(
        error.response?.data?.message ?? 'Registration failed'
      );
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
      clearTokens();
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
      .addCase(loginUser.fulfilled, (state, action: { payload: AuthResponse }) => {
        state.loading = false;
        state.user    = normaliseUser(action.payload.user);
        state.token   = action.payload.token;
        saveTokens(action.payload.token, action.payload.refreshToken);
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
      .addCase(registerUser.fulfilled, (state, action: { payload: AuthResponse }) => {
        state.loading = false;
        state.user    = normaliseUser(action.payload.user);
        state.token   = action.payload.token;
        saveTokens(action.payload.token, action.payload.refreshToken);
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
      .addCase(rehydrateAuth.fulfilled, (state, action: { payload: AuthUser }) => {
        state.loading = false;
        state.user    = normaliseUser(action.payload);
      })
      .addCase(rehydrateAuth.rejected, (state) => {
        state.loading = false;
        state.user    = null;
        state.token   = null;
        clearTokens();
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