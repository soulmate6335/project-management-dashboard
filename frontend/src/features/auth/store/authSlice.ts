// src/features/auth/store/authSlice.ts
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '../../../store/store';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'member' | 'viewer';
  avatarUrl?: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  /** true while rehydrating from storage or a login request is in flight */
  loading: boolean;
  error: string | null;
}

// ---------------------------------------------------------------------------
// Initial state — token seeded from localStorage so the app works across
// hard refreshes without a full redux-persist setup.
// ---------------------------------------------------------------------------
const storedToken = localStorage.getItem('auth_token');

const initialState: AuthState = {
  user: null,
  token: storedToken,
  // If we have a token we'll need to verify it; keep loading=true until then.
  loading: Boolean(storedToken),
  error: null,
};

// ---------------------------------------------------------------------------
// Async thunks (stubs — swap out the fetch calls for your Axios service)
// ---------------------------------------------------------------------------
import authService from '../../../services/authService';

export const loginUser = createAsyncThunk<
  { user: User; token: string },
  { email: string; password: string },
  { rejectValue: string }
>(
  'auth/login',
  async (credentials, { rejectWithValue }) => {
    try {
      const response = await authService.login(credentials);
      return {
        user: {
          ...response.user,
          role: response.user.role as User['role'],
        },
        token: response.token,
      };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Login failed';
      return rejectWithValue(message);
    }
  }
);

export const registerUser = createAsyncThunk<
  { user: User; token: string },
  { name: string; email: string; password: string },
  { rejectValue: string }
>(
  'auth/register',
  async (payload, { rejectWithValue }) => {
    try {
      const response = await authService.register(payload);
      return {
        user: {
          ...response.user,
          role: response.user.role as User['role'],
        },
        token: response.token,
      };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Registration failed';
      return rejectWithValue(message);
    }
  }
);

export const rehydrateAuth = createAsyncThunk<
  User,
  void,
  { state: RootState; rejectValue: string }
>(
  'auth/rehydrate',
  async (_, { getState, rejectWithValue }) => {
    const { auth } = getState() as RootState;
    if (!auth.token) return rejectWithValue('No token');
    try {
      const response = await authService.getCurrentUser();
      return {
        ...response,
        role: response.role as User['role'],
      };
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
    /** Hard logout — clears everything and removes the persisted token. */
    logout(state) {
      state.user = null;
      state.token = null;
      state.loading = false;
      state.error = null;
      localStorage.removeItem('auth_token');
    },
    clearError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // ── login ──────────────────────────────────────────────────────────
    builder
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        localStorage.setItem('auth_token', action.payload.token);
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // ── register ───────────────────────────────────────────────────────
    builder
      .addCase(registerUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        localStorage.setItem('auth_token', action.payload.token);
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // ── rehydrate ──────────────────────────────────────────────────────
    builder
      .addCase(rehydrateAuth.pending, (state) => {
        state.loading = true;
      })
      .addCase(rehydrateAuth.fulfilled, (state, action: PayloadAction<User>) => {
        state.loading = false;
        state.user = action.payload;
      })
      .addCase(rehydrateAuth.rejected, (state) => {
        // Token was invalid or expired — full reset.
        state.loading = false;
        state.user = null;
        state.token = null;
        localStorage.removeItem('auth_token');
      });
  },
});

export const { logout, clearError } = authSlice.actions;

// ---------------------------------------------------------------------------
// Selectors
// ---------------------------------------------------------------------------
export const selectIsAuthenticated = (state: RootState): boolean =>
  Boolean(state.auth.token && state.auth.user);

export const selectAuthLoading = (state: RootState): boolean => state.auth.loading;

export const selectCurrentUser = (state: RootState): User | null => state.auth.user;

export const selectAuthError = (state: RootState): string | null => state.auth.error;

export const selectAuthToken = (state: RootState): string | null => state.auth.token;

export default authSlice.reducer;