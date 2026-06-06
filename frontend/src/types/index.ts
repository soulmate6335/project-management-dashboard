// src/types/index.ts
export type ID = string;

export type UserRole     = 'admin' | 'member' | 'viewer';
export type MemberRole   = 'editor' | 'viewer';
export type ProjectStatus = 'active' | 'archived';
export type TaskStatus    = 'todo' | 'in_progress' | 'in_review' | 'done';
export type TaskPriority  = 'low' | 'medium' | 'high' | 'critical';

export interface User {
  _id:       ID;
  name:      string;
  email:     string;
  role:      UserRole;
  avatar?:   string;
  lastSeen?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectMember {
  user:     User;
  role:     MemberRole;
  joinedAt: string;
}

export interface Project {
  _id:          ID;
  name:         string;
  description?: string;
  owner:        User;
  members:      ProjectMember[];
  status:       ProjectStatus;
  progress:     number;
  memberCount:  number;
  createdAt:    string;
  updatedAt:    string;
}

export interface Task {
  _id:          ID;
  project:      ID;
  title:        string;
  description?: string;
  status:       TaskStatus;
  priority:     TaskPriority;
  assignee?:    User;
  reporter:     User;
  dueDate?:     string;
  order:        number;
  tags:         string[];
  completedAt?: string;
  isOverdue:    boolean;
  createdAt:    string;
  updatedAt:    string;
}

export interface TaskStatusSummary {
  todo:        number;
  in_progress: number;
  in_review:   number;
  done:        number;
}

export interface ApiSuccess<T> {
  success: true;
  message: string;
  data:    T;
  meta?:   PaginationMeta;
}

export interface ApiError {
  success: false;
  message: string;
  code:    string;
  errors?: Record<string, string[]>;
}

export interface PaginationMeta {
  page:       number;
  limit:      number;
  total:      number;
  totalPages: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
}

export interface CreateProjectPayload {
  name:         string;
  description?: string;
  progress?:    number;
  members?:     { user: ID; role: MemberRole }[];
}

export interface UpdateProjectPayload {
  name?:        string;
  description?: string;
  progress?:    number;
  members?:     { user: ID; role: MemberRole }[];
}

export interface ListProjectsParams {
  status?:  ProjectStatus;
  page?:    number;
  limit?:   number;
  search?:  string;
  sortBy?:  'createdAt' | 'updatedAt' | 'name' | 'progress';
  sortDir?: 'asc' | 'desc';
}

export interface CreateTaskPayload {
  title:        string;
  description?: string;
  status?:      TaskStatus;
  priority?:    TaskPriority;
  assignee?:    ID;
  dueDate?:     string;
  tags?:        string[];
  order?:       number;
}

export interface UpdateTaskPayload {
  title?:       string;
  description?: string;
  status?:      TaskStatus;
  priority?:    TaskPriority;
  assignee?:    ID | null;
  dueDate?:     string | null;
  tags?:        string[];
  order?:       number;
}

export interface ListTasksParams {
  status?:   TaskStatus;
  priority?: TaskPriority;
  assignee?: ID;
  search?:   string;
  page?:     number;
  limit?:    number;
  sortBy?:   'createdAt' | 'updatedAt' | 'dueDate' | 'priority' | 'order';
  sortDir?:  'asc' | 'desc';
}

export interface ReorderTasksPayload {
  tasks: { id: ID; order: number }[];
}