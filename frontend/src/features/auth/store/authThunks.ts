import { createAsyncThunk } from '@reduxjs/toolkit';
import { apiClient } from '../../../services/apiClient';
import { setCredentials, setLoading, setError } from './authSlice';
import { syncSocketToken } from '../socketSync';

// ---------------------------------------------------------------------------
// LOGIN
// ---------------------------------------------------------------------------
export const loginUser = createAsyncThunk(
  'auth/loginUser',
  async (
    data: { email: string; password: string },
    { dispatch, rejectWithValue }
  ) => {
    try {
      dispatch(setLoading(true));

      const res = await apiClient.post('/auth/login', data);

      const { user, token } = res.data.data;

      dispatch(setCredentials({ user, token }));
      syncSocketToken(token);

      return { user, token };
    } catch (err: unknown) {
      const apiError = err as { response?: { data?: { message?: string } } };
      const message =
        apiError.response?.data?.message || 'Login failed';

      dispatch(setError(message));
      return rejectWithValue(message);
    }
  }
);

// ---------------------------------------------------------------------------
// REGISTER
// ---------------------------------------------------------------------------
export const registerUser = createAsyncThunk(
  'auth/registerUser',
  async (
    data: { name: string; email: string; password: string },
    { dispatch, rejectWithValue }
  ) => {
    try {
      dispatch(setLoading(true));

      const res = await apiClient.post('/auth/register', data);

      const { user, token } = res.data.data;

      dispatch(setCredentials({ user, token }));
      syncSocketToken(token);

      return { user, token };
    } catch (err: unknown) {
      const apiError = err as { response?: { data?: { message?: string } } };
      const message =
        apiError.response?.data?.message || 'Registration failed';

      dispatch(setError(message));
      return rejectWithValue(message);
    }
  }
);