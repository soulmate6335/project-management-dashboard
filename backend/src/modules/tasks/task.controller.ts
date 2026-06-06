// src/modules/tasks/task.controller.ts
import { Request, Response } from 'express';
import taskService                          from './task.service';
import { sendSuccess, sendCreated, sendNoContent } from '../../utils/ApiResponse';
import { asyncHandler }                     from '../../utils/asyncHandler';
import { ApiError }                         from '../../utils/ApiError';
import type {
  CreateTaskInput,
  UpdateTaskInput,
  ListTasksQuery,
  ReorderTasksInput,
} from './task.validation';

// ---------------------------------------------------------------------------
// Helper
// ---------------------------------------------------------------------------
function requireUser(req: Request): string {
  if (!req.user?.id) throw ApiError.unauthorized();
  return req.user.id;
}

// ---------------------------------------------------------------------------
// POST /api/v1/projects/:projectId/tasks
// ---------------------------------------------------------------------------
export const createTask = asyncHandler(async (req: Request, res: Response) => {
  const userId    = requireUser(req);
  const projectId = req.params['projectId'] as string;
  const body      = req.body as CreateTaskInput;

  const task = await taskService.create(projectId, body, userId);
  sendCreated(res, task, 'Task created');
});

// ---------------------------------------------------------------------------
// GET /api/v1/projects/:projectId/tasks
// ---------------------------------------------------------------------------
export const listTasks = asyncHandler(async (req: Request, res: Response) => {
  const userId    = requireUser(req);
  const projectId = req.params['projectId'] as string;
  const query     = req.query as unknown as ListTasksQuery;

  const { tasks, total, page, limit, totalPages } =
    await taskService.list(projectId, userId, query);

  sendSuccess(res, tasks, 'Tasks retrieved', 200, { page, limit, total, totalPages });
});

// ---------------------------------------------------------------------------
// GET /api/v1/projects/:projectId/tasks/:id
// ---------------------------------------------------------------------------
export const getTask = asyncHandler(async (req: Request, res: Response) => {
  const userId    = requireUser(req);
  const projectId = req.params['projectId'] as string;
  const taskId    = req.params['id'] as string;

  const task = await taskService.getById(taskId, projectId, userId);
  sendSuccess(res, task, 'Task retrieved');
});

// ---------------------------------------------------------------------------
// PATCH /api/v1/projects/:projectId/tasks/:id
// ---------------------------------------------------------------------------
export const updateTask = asyncHandler(async (req: Request, res: Response) => {
  const userId    = requireUser(req);
  const projectId = req.params['projectId'] as string;
  const taskId    = req.params['id'] as string;
  const body      = req.body as UpdateTaskInput;

  const task = await taskService.update(taskId, projectId, body, userId);
  sendSuccess(res, task, 'Task updated');
});

// ---------------------------------------------------------------------------
// DELETE /api/v1/projects/:projectId/tasks/:id
// ---------------------------------------------------------------------------
export const deleteTask = asyncHandler(async (req: Request, res: Response) => {
  const userId    = requireUser(req);
  const projectId = req.params['projectId'] as string;
  const taskId    = req.params['id'] as string;

  await taskService.remove(taskId, projectId, userId);
  sendNoContent(res);
});

// ---------------------------------------------------------------------------
// PATCH /api/v1/projects/:projectId/tasks/reorder
// ---------------------------------------------------------------------------
export const reorderTasks = asyncHandler(async (req: Request, res: Response) => {
  const userId    = requireUser(req);
  const projectId = req.params['projectId'] as string;
  const body      = req.body as ReorderTasksInput;

  await taskService.reorder(projectId, body, userId);
  sendSuccess(res, null, 'Tasks reordered');
});

// ---------------------------------------------------------------------------
// GET /api/v1/projects/:projectId/tasks/summary
// ---------------------------------------------------------------------------
export const getTaskSummary = asyncHandler(async (req: Request, res: Response) => {
  const userId    = requireUser(req);
  const projectId = req.params['projectId'] as string;

  const summary = await taskService.getStatusSummary(projectId, userId);
  sendSuccess(res, summary, 'Task summary retrieved');
});