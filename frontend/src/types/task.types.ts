export type TaskStatus =
  | 'todo'
  | 'in_progress'
  | 'in_review'
  | 'done';

export interface Task {
  _id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  order: number;
  project: string;
  assignedTo?: string;
  dueDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTaskPayload {
  title: string;
  description?: string;
  status?: TaskStatus;
  assignedTo?: string;
  dueDate?: string;
}

export interface UpdateTaskPayload {
  title?: string;
  description?: string;
  status?: TaskStatus;
  assignedTo?: string;
  dueDate?: string;
}

export interface ListTasksParams {
  status?: TaskStatus;
}

export interface ReorderTasksPayload {
  tasks: {
    id: string;
    order: number;
  }[];
}