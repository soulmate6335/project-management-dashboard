import api from '../services/apiClient';
import { useAppDispatch } from '../app/hooks';
import { setCredentials, logout } from '../features/auth/store/authSlice';

export function useAuth() {
  const dispatch = useAppDispatch();

  const login = async (email: string, password: string) => {
    const res = await api.post('/auth/login', {
      email,
      password,
    });

    const { user, token } = res.data.data;

    dispatch(setCredentials({ user, token }));
  };

  const register = async (name: string, email: string, password: string) => {
    const res = await api.post('/auth/register', {
      name,
      email,
      password,
    });

    const { user, token } = res.data.data;

    dispatch(setCredentials({ user, token }));
  };

  const logoutUser = () => {
    dispatch(logout());
  };

  return {
    login,
    register,
    logoutUser,
  };
}