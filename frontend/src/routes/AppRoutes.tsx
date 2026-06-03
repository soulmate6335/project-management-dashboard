// src/routes/AppRoutes.tsx
import { ROUTES } from './routes';
import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom';
import { Box, CircularProgress } from '@mui/material';
import { useAppSelector } from '../app/hooks';
import { selectIsAuthenticated, selectAuthLoading } from '../features/auth/store/authSlice';
import AuthLayout from '../layouts/AuthLayout';
import DashboardLayout from '../layouts/DashboardLayout';
import ProtectedRoute from './ProtectedRoute';


const LoginPage    = lazy(() => import('../pages/LoginPage'));
const RegisterPage = lazy(() => import('../pages/RegisterPage'));
const DashboardPage = lazy(() => import('../pages/DashboardPage'));
const ProjectsPage  = lazy(() => import('../pages/ProjectsPage'));
const TasksPage     = lazy(() => import('../pages/TasksPage'));
const NotFoundPage  = lazy(() => import('../pages/NotFoundPage'));


function PageLoader() {
  return (
    <Box display="flex" alignItems="center" justifyContent="center" minHeight="100vh"
      bgcolor="background.default">
      <CircularProgress size={48} thickness={3} />
    </Box>
  );
}

/**
 * PublicOnlyRoute
 * Redirects already-authenticated users away from /login and /register.
 * Sends them to the originally intended destination, or /dashboard as fallback.
 */
function PublicOnlyRoute() {
  const location = useLocation();
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const isLoading = useAppSelector(selectAuthLoading);

  if (isLoading) {
    return <PageLoader />;
  }

  if (isAuthenticated) {
    const destination =
      (location.state as { from?: { pathname: string } })?.from?.pathname ?? ROUTES.DASHBOARD;
    return <Navigate to={destination} replace />;
  }

  return <Outlet />;
}

export default function AppRoutes() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* Root redirect */}
        <Route path={ROUTES.ROOT} element={<Navigate to={ROUTES.DASHBOARD} replace />} />

        {/* Public-only routes — authenticated users are bounced to /dashboard */}
        <Route element={<PublicOnlyRoute />}>
          <Route element={<AuthLayout />}>
            <Route path={ROUTES.LOGIN}    element={<LoginPage />} />
            <Route path={ROUTES.REGISTER} element={<RegisterPage />} />
          </Route>
        </Route>

        {/* Protected routes — unauthenticated users are bounced to /login */}
        <Route element={<ProtectedRoute />}>
          <Route element={<DashboardLayout />}>
            <Route path={ROUTES.DASHBOARD}      element={<DashboardPage />} />
            <Route path={ROUTES.PROJECTS}        element={<ProjectsPage />} />
            <Route path={ROUTES.PROJECT_DETAIL}  element={<ProjectsPage />} />
            <Route path={ROUTES.TASKS}           element={<TasksPage />} />
            <Route path={ROUTES.TASK_DETAIL}     element={<TasksPage />} />
          </Route>
        </Route>

        {/* 404 */}
        <Route path={ROUTES.NOT_FOUND} element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  );
}