// src/modules/projects/project.routes.ts
import { Router } from 'express';
import { authMiddleware }   from '../../middleware/auth.middleware';
import { validate }         from '../../middleware/validate.middleware';
import {
  createProjectSchema,
  updateProjectSchema,
  projectIdSchema,
  listProjectsSchema,
} from './project.validation';
import {
  createProject,
  listProjects,
  getProject,
  updateProject,
  archiveProject,
  deleteProject,
} from './project.controller';

const router = Router();

// All project routes require a valid JWT
router.use(authMiddleware);

// ---------------------------------------------------------------------------
// Collection routes
// ---------------------------------------------------------------------------
router
  .route('/')
  .get(validate(listProjectsSchema),  listProjects)
  .post(validate(createProjectSchema), createProject);

// ---------------------------------------------------------------------------
// Document routes
// ---------------------------------------------------------------------------
router
  .route('/:id')
  .get(validate(projectIdSchema),    getProject)
  .patch(validate(updateProjectSchema), updateProject)
  .delete(validate(projectIdSchema), deleteProject);

// ---------------------------------------------------------------------------
// Actions
// ---------------------------------------------------------------------------
router.patch(
  '/:id/archive',
  validate(projectIdSchema),
  archiveProject
);

export default router;