// src/modules/tasks/task.validation.ts
import { z } from 'zod';

// ---------------------------------------------------------------------------
// Shared field definitions
// ---------------------------------------------------------------------------
const mongoId = z
  .string()
  .regex(/^[a-f\d]{24}$/i, 'Invalid ID format');

const taskTitle = z
  .string({ required_error: 'Task title is required' })
  .trim()
  .min(2,   'Title must be at least 2 characters')
  .max(200, 'Title must be 200 characters or fewer');

const taskDescription = z
  .string()
  .trim()
  .max(5000, 'Description must be 5000 characters or fewer')
  .optional();

const taskStatus = z.enum(['todo', 'in_progress', 'in_review', 'done'], {
  errorMap: () => ({
    message: "Status must be one of: todo, in_progress, in_review, done",
  }),
});

const taskPriority = z.enum(['low', 'medium', 'high', 'critical'], {
  errorMap: () => ({
    message: "Priority must be one of: low, medium, high, critical",
  }),
});

const dueDateField = z
  .string()
  .datetime({ message: 'Due date must be a valid ISO 8601 date string' })
  .refine(
    (val) => new Date(val) > new Date(),
    { message: 'Due date must be in the future' }
  )
  .optional();

const tagsField = z
  .array(z.string().trim().min(1).max(30))
  .max(10, 'A task cannot have more than 10 tags')
  .optional()
  .default([]);

// ---------------------------------------------------------------------------
// Route param schemas — reused across all task routes
// ---------------------------------------------------------------------------
const projectTaskParams = z.object({
  projectId: mongoId,
  id:        mongoId,
});

const projectOnlyParams = z.object({
  projectId: mongoId,
});

// ---------------------------------------------------------------------------
// Schemas
// ---------------------------------------------------------------------------
export const createTaskSchema = z.object({
  params: projectOnlyParams,
  body: z.object({
    title:       taskTitle,
    description: taskDescription,
    status:      taskStatus.optional().default('todo'),
    priority:    taskPriority.optional().default('medium'),
    assignee:    mongoId.optional(),
    dueDate:     dueDateField,
    tags:        tagsField,
    order:       z.number().int().min(0).optional().default(0),
  }),
});

export const updateTaskSchema = z.object({
  params: projectTaskParams,
  body: z.object({
    title:       taskTitle.optional(),
    description: taskDescription,
    status:      taskStatus.optional(),
    priority:    taskPriority.optional(),
    assignee:    mongoId.nullable().optional(), // null = unassign
    dueDate:     z
      .string()
      .datetime({ message: 'Due date must be a valid ISO 8601 date string' })
      .nullable()   // null = clear due date
      .optional(),
    tags:        tagsField,
    order:       z.number().int().min(0).optional(),
  }).refine(
    (data) => Object.keys(data).length > 0,
    { message: 'At least one field must be provided for update' }
  ),
});

export const taskIdSchema = z.object({
  params: projectTaskParams,
});

export const listTasksSchema = z.object({
  params: projectOnlyParams,
  query: z.object({
    status:   taskStatus.optional(),
    priority: taskPriority.optional(),
    assignee: mongoId.optional(),
    search:   z.string().trim().optional(),
    page:     z.coerce.number().int().min(1).optional().default(1),
    limit:    z.coerce.number().int().min(1).max(100).optional().default(50),
    sortBy:   z.enum(['createdAt', 'updatedAt', 'dueDate', 'priority', 'order'])
               .optional()
               .default('order'),
    sortDir:  z.enum(['asc', 'desc']).optional().default('asc'),
  }),
});

export const reorderTasksSchema = z.object({
  params: projectOnlyParams,
  body: z.object({
    // Array of { id, order } pairs — client sends full column ordering after drag
    tasks: z
      .array(
        z.object({
          id:    mongoId,
          order: z.number().int().min(0),
        })
      )
      .min(1, 'At least one task must be provided for reordering'),
  }),
});

// ---------------------------------------------------------------------------
// Inferred types
// ---------------------------------------------------------------------------
export type CreateTaskInput   = z.infer<typeof createTaskSchema>['body'];
export type UpdateTaskInput   = z.infer<typeof updateTaskSchema>['body'];
export type ListTasksQuery    = z.infer<typeof listTasksSchema>['query'];
export type ReorderTasksInput = z.infer<typeof reorderTasksSchema>['body'];