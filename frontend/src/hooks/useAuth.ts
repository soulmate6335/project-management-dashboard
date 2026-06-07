import api from '../services/apiClient';
import { useAppDispatch } from '../app/hooks';
import {
  setCredentials,
  setLoading,
  logout,
} from '../features/auth/store/authSlice';

export function useAuth() {
  const dispatch = useAppDispatch();

  // ---------------------------------------------------------------------------
  // LOGIN
  // ---------------------------------------------------------------------------
  const login = async (email: string, password: string) => {
    try {
      dispatch(setLoading(true));

      const res = await api.post('/auth/login', {
        email,
        password,
      });

      const { user, token } = res.data.data;

      dispatch(setCredentials({ user, token }));
    } finally {
      dispatch(setLoading(false));
    }
  };

  // ---------------------------------------------------------------------------
  // REGISTER
  // ---------------------------------------------------------------------------
  const register = async (
    name: string,
    email: string,
    password: string
  ) => {
    try {
      dispatch(setLoading(true));

      const res = await api.post('/auth/register', {
        name,
        email,
        password,
      });

      const { user, token } = res.data.data;

      dispatch(setCredentials({ user, token }));
    } finally {
      dispatch(setLoading(false));
    }
  };

  // ---------------------------------------------------------------------------
  // LOGOUT
  // ---------------------------------------------------------------------------
  const logoutUser = () => {
    dispatch(logout());
  };

  return {
    login,
    register,
    logoutUser,
  };
}