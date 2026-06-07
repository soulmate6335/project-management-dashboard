// src/routes/routes.ts
export const ROUTES = {
  ROOT:            '/',
  LOGIN:           '/login',
  REGISTER:        '/register',
  FORGOT_PASSWORD: '/forgot-password',
  DASHBOARD:       '/dashboard',
  PROJECTS:        '/projects',
  PROJECT_DETAIL:  '/projects/:projectId',
  TASKS:           '/projects/:projectId/tasks',
  NOT_FOUND:       '*',
} as const;