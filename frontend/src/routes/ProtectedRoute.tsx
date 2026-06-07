import { Navigate } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useAppSelector } from '../app/hooks';

export default function ProtectedRoute({
  children,
}: {
  children: ReactNode;
}) {
  const isAuthenticated = useAppSelector(
    (state) => state.auth.isAuthenticated
  );

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
}