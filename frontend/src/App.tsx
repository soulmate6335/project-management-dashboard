import { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAppSelector } from './app/hooks';
import { selectIsAuthenticated } from './features/auth/store/authSlice';

import AppRoutes from './routes/AppRoutes';
import { useSocketConnection } from './hooks/useSocket';

export default function App() {
  useAppSelector(selectIsAuthenticated);

  useSocketConnection();

  useEffect(() => {
    // global init
  }, []);

  return (
    <Routes>
      <Route path="/*" element={<AppRoutes />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}