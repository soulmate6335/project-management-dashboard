// src/AppWrapper.tsx [FRONTEND]
import { useEffect, useRef } from 'react';
import { useAppDispatch, useAppSelector } from './app/hooks';
import {
  selectAuthToken,
  selectAuthLoading,
  rehydrateUser,
  rehydrateFailed,
} from './features/auth/store/authSlice';
import { apiClient } from './services/apiClient';
import AppRoutes     from './routes/AppRoutes';

export default function AppWrapper() {
  const dispatch    = useAppDispatch();
  const token       = useAppSelector(selectAuthToken);
  const loading     = useAppSelector(selectAuthLoading);
  const didRun      = useRef(false); // prevent double-run in StrictMode

  useEffect(() => {
    if (didRun.current) return;
    didRun.current = true;

    if (!token) {
      dispatch(rehydrateFailed());
      return;
    }

    apiClient.get('/auth/me')
      .then((res) => {
        const raw  = res.data.data;
        dispatch(rehydrateUser({
          id:     raw._id  ?? raw.id ?? '',
          name:   raw.name,
          email:  raw.email,
          role:   raw.role   ?? 'member',
          avatar: raw.avatar ?? null,
        }));
      })
      .catch(() => {
        dispatch(rehydrateFailed());
      });
  }, [dispatch, token]);

  // Safety net — force stop loading after 3 seconds
  useEffect(() => {
    if (!loading) return;
    const timer = setTimeout(() => {
      dispatch(rehydrateFailed());
    }, 3000);
    return () => clearTimeout(timer);
  }, [loading, dispatch]);

  return <AppRoutes />;
}


