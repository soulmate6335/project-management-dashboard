// src/routes/ProtectedRoute.tsx [FRONTEND]
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAppSelector } from '../app/hooks';
import {
  selectIsAuthenticated,
  selectAuthLoading,
} from '../features/auth/store/authSlice';
import { Box, CircularProgress } from '@mui/material';

export default function ProtectedRoute() {
  const location        = useLocation();
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const isLoading       = useAppSelector(selectAuthLoading);

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <CircularProgress size={48} thickness={3} />
      </Box>
    );
  }

  if (!isAuthenticated) {
    return (
      <Navigate to="/login" state={{ from: location }} replace />
    );
  }

  return <Outlet />;
}