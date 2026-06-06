// src/modules/tasks/task.routes.ts
//
// Mounted at /api/v1/projects/:projectId/tasks in app.ts.
// mergeParams: true is required so :projectId from the parent router
// is accessible in req.params inside these handlers.

import { Router } from 'express';
import { authMiddleware }   from '../../middleware/auth.middleware';
import { validate }         from '../../middleware/validate.middleware';
import {
  createTaskSchema,
  updateTaskSchema,
  taskIdSchema,
  listTasksSchema,
  reorderTasksSchema,
} from './task.validation';
import {
  createTask,
  listTasks,
  getTask,
  updateTask,
  deleteTask,
  reorderTasks,
  getTaskSummary,
} from './task.controller';

const router = Router({ mergeParams: true });

// All task routes require authentication
router.use(authMiddleware);

// ---------------------------------------------------------------------------
// Utility routes — must come BEFORE /:id to avoid "summary"/"reorder"
// being matched as a task ID
// ---------------------------------------------------------------------------
router.get(
  '/summary',
  getTaskSummary
);

router.patch(
  '/reorder',
  validate(reorderTasksSchema),
  reorderTasks
);

// ---------------------------------------------------------------------------
// Collection routes
// ---------------------------------------------------------------------------
router
  .route('/')
  .get(validate(listTasksSchema),  listTasks)
  .post(validate(createTaskSchema), createTask);

// ---------------------------------------------------------------------------
// Document routes
// ---------------------------------------------------------------------------
router
  .route('/:id')
  .get(validate(taskIdSchema),    getTask)
  .patch(validate(updateTaskSchema), updateTask)
  .delete(validate(taskIdSchema), deleteTask);

export default router;