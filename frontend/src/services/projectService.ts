// src/services/projectService.ts
import { apiClient, unwrap }  from './apiClient';
import type {
  Project,
  PaginatedResponse,
  CreateProjectPayload,
  UpdateProjectPayload,
  ListProjectsParams,
} from '../types';

const BASE = '/projects';

// ---------------------------------------------------------------------------
// GET /projects
// ---------------------------------------------------------------------------
async function list(
  params?: ListProjectsParams
): Promise<PaginatedResponse<Project>> {
  const response = await apiClient.get(BASE, { params });
  return {
    data: response.data.data,
    meta: response.data.meta,
  };
}

// ---------------------------------------------------------------------------
// GET /projects/:id
// ---------------------------------------------------------------------------
async function getById(id: string): Promise<Project> {
  const response = await apiClient.get(`${BASE}/${id}`);
  return unwrap(response);
}

// ---------------------------------------------------------------------------
// POST /projects
// ---------------------------------------------------------------------------
async function create(payload: CreateProjectPayload): Promise<Project> {
  const response = await apiClient.post(BASE, payload);
  return unwrap(response);
}

// ---------------------------------------------------------------------------
// PATCH /projects/:id
// ---------------------------------------------------------------------------
async function update(
  id: string,
  payload: UpdateProjectPayload
): Promise<Project> {
  const response = await apiClient.patch(`${BASE}/${id}`, payload);
  return unwrap(response);
}

// ---------------------------------------------------------------------------
// PATCH /projects/:id/archive
// ---------------------------------------------------------------------------
async function archive(id: string): Promise<Project> {
  const response = await apiClient.patch(`${BASE}/${id}/archive`);
  return unwrap(response);
}

// ---------------------------------------------------------------------------
// DELETE /projects/:id
// ---------------------------------------------------------------------------
async function remove(id: string): Promise<void> {
  await apiClient.delete(`${BASE}/${id}`);
}

const projectService = { list, getById, create, update, archive, remove };
export default projectService;