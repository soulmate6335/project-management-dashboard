// src/routes/AppRoutes.tsx [FRONTEND]
import { lazy, Suspense }          from 'react';
import { Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom';
import { Box, CircularProgress }   from '@mui/material';
import { useAppSelector }          from '../app/hooks';
import { selectAuthLoading, selectIsAuthenticated } from '../features/auth/store/authSlice';
import AuthLayout                  from '../layouts/AuthLayout';
import DashboardLayout             from '../layouts/DashboardLayout';
import ProtectedRoute              from './ProtectedRoute';


const LoginPage     = lazy(() => import('../pages/LoginPage'));
const RegisterPage  = lazy(() => import('../pages/RegisterPage'));
const DashboardPage = lazy(() => import('../pages/DashboardPage'));
const ProjectsPage  = lazy(() => import('../pages/ProjectsPage'));
const TasksPage     = lazy(() => import('../pages/TasksPage'));
const NotFoundPage  = lazy(() => import('../pages/NotFoundPage'));

const ROUTES = {
  ROOT:           '/',
  LOGIN:          '/login',
  REGISTER:       '/register',
  DASHBOARD:      '/dashboard',
  PROJECTS:       '/projects',
  PROJECT_DETAIL: '/projects/:projectId',
  TASKS:          '/projects/:projectId/tasks',
  NOT_FOUND:      '*',
} as const;

function PageLoader() {
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        bgcolor: 'background.default',
      }}
    >
      <CircularProgress size={48} thickness={3} />
    </Box>
  );
}

function PublicOnlyRoute() {
  const location        = useLocation();
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const isLoading       = useAppSelector(selectAuthLoading);
  if (isLoading)       return <PageLoader />;
  if (isAuthenticated) {
    const dest = (location.state as { from?: { pathname: string } })?.from?.pathname ?? ROUTES.DASHBOARD;
    return <Navigate to={dest} replace />;
  }
  return <Outlet />;
}

export default function AppRoutes() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route path={ROUTES.ROOT} element={<Navigate to={ROUTES.DASHBOARD} replace />} />
        <Route element={<PublicOnlyRoute />}>
          <Route element={<AuthLayout />}>
            <Route path={ROUTES.LOGIN}    element={<LoginPage />} />
            <Route path={ROUTES.REGISTER} element={<RegisterPage />} />
          </Route>
        </Route>
        <Route element={<ProtectedRoute><Outlet /></ProtectedRoute>}>
          <Route element={<DashboardLayout />}>
            <Route path={ROUTES.DASHBOARD}     element={<DashboardPage />} />
            <Route path={ROUTES.PROJECTS}       element={<ProjectsPage />} />
            <Route path={ROUTES.PROJECT_DETAIL} element={<ProjectsPage />} />
            <Route path={ROUTES.TASKS}          element={<TasksPage />} />
          </Route>
        </Route>
        <Route path={ROUTES.NOT_FOUND} element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  );
}