// src/services/taskService.ts
import { apiClient, unwrap }  from './apiClient';
import type {
  Task,
  TaskStatusSummary,
  PaginatedResponse,
  CreateTaskPayload,
  UpdateTaskPayload,
  ListTasksParams,
  ReorderTasksPayload,
} from '../types';

function base(projectId: string): string {
  return `/projects/${projectId}/tasks`;
}

// ---------------------------------------------------------------------------
// GET /projects/:projectId/tasks/summary
// ---------------------------------------------------------------------------
async function getSummary(projectId: string): Promise<TaskStatusSummary> {
  const response = await apiClient.get(`${base(projectId)}/summary`);
  return unwrap(response);
}

// ---------------------------------------------------------------------------
// GET /projects/:projectId/tasks
// ---------------------------------------------------------------------------
async function list(
  projectId: string,
  params?: ListTasksParams
): Promise<PaginatedResponse<Task>> {
  const response = await apiClient.get(base(projectId), { params });
  return {
    data: response.data.data,
    meta: response.data.meta,
  };
}

// ---------------------------------------------------------------------------
// GET /projects/:projectId/tasks/:id
// ---------------------------------------------------------------------------
async function getById(projectId: string, taskId: string): Promise<Task> {
  const response = await apiClient.get(`${base(projectId)}/${taskId}`);
  return unwrap(response);
}

// ---------------------------------------------------------------------------
// POST /projects/:projectId/tasks
// ---------------------------------------------------------------------------
async function create(
  projectId: string,
  payload: CreateTaskPayload
): Promise<Task> {
  const response = await apiClient.post(base(projectId), payload);
  return unwrap(response);
}

// ---------------------------------------------------------------------------
// PATCH /projects/:projectId/tasks/:id
// ---------------------------------------------------------------------------
async function update(
  projectId: string,
  taskId: string,
  payload: UpdateTaskPayload
): Promise<Task> {
  const response = await apiClient.patch(`${base(projectId)}/${taskId}`, payload);
  return unwrap(response);
}

// ---------------------------------------------------------------------------
// DELETE /projects/:projectId/tasks/:id
// ---------------------------------------------------------------------------
async function remove(projectId: string, taskId: string): Promise<void> {
  await apiClient.delete(`${base(projectId)}/${taskId}`);
}

// ---------------------------------------------------------------------------
// PATCH /projects/:projectId/tasks/reorder
// ---------------------------------------------------------------------------
async function reorder(
  projectId: string,
  payload: ReorderTasksPayload
): Promise<void> {
  await apiClient.patch(`${base(projectId)}/reorder`, payload);
}

const taskService = {
  getSummary,
  list,
  getById,
  create,
  update,
  remove,
  reorder,
};

export default taskService;