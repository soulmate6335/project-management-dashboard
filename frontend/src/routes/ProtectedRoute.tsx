import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAppSelector } from '../app/hooks';
import {
  selectIsAuthenticated,
  selectAuthLoading,
} from '../features/auth/store/authSlice';
import { Box, CircularProgress } from '@mui/material';

export default function ProtectedRoute({
  children,
}: {
  children: ReactNode;
}) {
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const loading = useAppSelector(selectAuthLoading);
  const location = useLocation();
  const hydrated = useAppSelector((state) => state.auth.hydrated);


  // 🔥 BLOCK ROUTES WHILE AUTH IS STILL LOADING
if (!hydrated || loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  // ❌ NOT LOGGED IN → SEND TO LOGIN
  if (!isAuthenticated) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location }}
      />
    );
  }

  // ✅ AUTH OK
  return children;
}