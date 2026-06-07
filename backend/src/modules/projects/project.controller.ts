// src/modules/projects/project.controller.ts
import { Request, Response } from 'express';
import projectService from './project.service';
import { sendSuccess, sendCreated, sendNoContent } from '../../utils/ApiResponse';
import { asyncHandler } from '../../utils/asyncHandler';
import { ApiError } from '../../utils/ApiError';

import Task from '../tasks/task.model'; // ✅ IMPORTANT: needed for analytics

import type {
  CreateProjectInput,
  UpdateProjectInput,
  ListProjectsQuery,
} from './project.validation';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function requireUser(req: Request): string {
  if (!req.user?.id) throw ApiError.unauthorized();
  return req.user.id;
}

// ---------------------------------------------------------------------------
// POST /api/v1/projects
// ---------------------------------------------------------------------------
export const createProject = asyncHandler(async (req: Request, res: Response) => {
  const userId = requireUser(req);
  const body = req.body as CreateProjectInput;

  const project = await projectService.create(body, userId);

  sendCreated(res, project, 'Project created');
});

// ---------------------------------------------------------------------------
// GET /api/v1/projects
// ---------------------------------------------------------------------------
export const listProjects = asyncHandler(async (req: Request, res: Response) => {
  const userId = requireUser(req);
  const query = req.query as unknown as ListProjectsQuery;

  const { projects, total, page, limit, totalPages } =
    await projectService.list(userId, query);

  sendSuccess(
    res,
    projects,
    'Projects retrieved',
    200,
    { page, limit, total, totalPages }
  );
});

// ---------------------------------------------------------------------------
// GET /api/v1/projects/:id
// ---------------------------------------------------------------------------
export const getProject = asyncHandler(async (req: Request, res: Response) => {
  const userId = requireUser(req);
  const projectId = req.params.id;

  const project = await projectService.getById(projectId, userId);

  sendSuccess(res, project, 'Project retrieved');
});

// ---------------------------------------------------------------------------
// PATCH /api/v1/projects/:id
// ---------------------------------------------------------------------------
export const updateProject = asyncHandler(async (req: Request, res: Response) => {
  const userId = requireUser(req);
  const projectId = req.params.id;
  const body = req.body as UpdateProjectInput;

  const project = await projectService.update(projectId, body, userId);

  sendSuccess(res, project, 'Project updated');
});

// ---------------------------------------------------------------------------
// PATCH /api/v1/projects/:id/archive
// ---------------------------------------------------------------------------
export const archiveProject = asyncHandler(async (req: Request, res: Response) => {
  const userId = requireUser(req);
  const projectId = req.params.id;

  const project = await projectService.archive(projectId, userId);

  sendSuccess(res, project, 'Project archived');
});

// ---------------------------------------------------------------------------
// DELETE /api/v1/projects/:id
// ---------------------------------------------------------------------------
export const deleteProject = asyncHandler(async (req: Request, res: Response) => {
  const userId = requireUser(req);
  const projectId = req.params.id;

  await projectService.remove(projectId, userId);

  sendNoContent(res);
});

// ---------------------------------------------------------------------------
// 📊 ANALYTICS ENDPOINT
// GET /api/v1/projects/:projectId/analytics
// ---------------------------------------------------------------------------
export const getProjectAnalytics = asyncHandler(async (req: Request, res: Response) => {
  const userId = requireUser(req);
  const projectId = req.params.projectId;

  // ensure project belongs to user (security)
  await projectService.getById(projectId, userId);

  const tasks = await Task.find({ project: projectId });

  const statusMap: Record<string, number> = {};
  const priorityMap: Record<string, number> = {};

  tasks.forEach((t) => {
    statusMap[t.status] = (statusMap[t.status] || 0) + 1;
    priorityMap[t.priority || 'low'] =
      (priorityMap[t.priority || 'low'] || 0) + 1;
  });

  const tasksByStatus = Object.entries(statusMap).map(([name, value]) => ({
    name,
    value,
  }));

  const tasksByPriority = Object.entries(priorityMap).map(([name, value]) => ({
    name,
    value,
  }));

  sendSuccess(res, {
    tasksByStatus,
    tasksByPriority,
  }, 'Analytics retrieved');
});