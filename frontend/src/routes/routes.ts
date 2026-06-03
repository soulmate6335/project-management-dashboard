export const ROUTES = {
  ROOT: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  FORGOT_PASSWORD: '/forgot-password',

  DASHBOARD: '/dashboard',

  PROJECTS: '/projects',
  PROJECT_DETAIL: '/projects/:projectId',

  TASKS: '/tasks',
  TASK_DETAIL: '/tasks/:taskId',

  ANALYTICS: '/analytics',

  NOT_FOUND: '*',
} as const;