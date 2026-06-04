// src/modules/projects/project.validation.ts
import { z } from 'zod';

// ---------------------------------------------------------------------------
// Reusable field definitions
// ---------------------------------------------------------------------------
const projectName = z
  .string({ required_error: 'Project name is required' })
  .trim()
  .min(2,   'Name must be at least 2 characters')
  .max(120, 'Name must be 120 characters or fewer');

const projectDescription = z
  .string()
  .trim()
  .max(1000, 'Description must be 1000 characters or fewer')
  .optional();

const progressField = z
  .number()
  .int('Progress must be a whole number')
  .min(0,   'Progress cannot be negative')
  .max(100, 'Progress cannot exceed 100')
  .optional();

const mongoId = z
  .string()
  .regex(/^[a-f\d]{24}$/i, 'Invalid ID format');

// ---------------------------------------------------------------------------
// Schemas
// ---------------------------------------------------------------------------
export const createProjectSchema = z.object({
  body: z.object({
    name:        projectName,
    description: projectDescription,
    progress:    progressField,
    members: z
      .array(
        z.object({
          user: mongoId,
          role: z.enum(['editor', 'viewer']).default('viewer'),
        })
      )
      .optional()
      .default([]),
  }),
});

export const updateProjectSchema = z.object({
  params: z.object({ id: mongoId }),
  body: z.object({
    name:        projectName.optional(),
    description: projectDescription,
    progress:    progressField,
    members: z
      .array(
        z.object({
          user: mongoId,
          role: z.enum(['editor', 'viewer']),
        })
      )
      .optional(),
  }).refine(
    (data) => Object.keys(data).length > 0,
    { message: 'At least one field must be provided for update' }
  ),
});

export const projectIdSchema = z.object({
  params: z.object({ id: mongoId }),
});

export const listProjectsSchema = z.object({
  query: z.object({
    status:  z.enum(['active', 'archived']).optional(),
    page:    z.coerce.number().int().min(1).optional().default(1),
    limit:   z.coerce.number().int().min(1).max(100).optional().default(20),
    search:  z.string().trim().optional(),
    sortBy:  z.enum(['createdAt', 'updatedAt', 'name', 'progress']).optional().default('createdAt'),
    sortDir: z.enum(['asc', 'desc']).optional().default('desc'),
  }),
});

// ---------------------------------------------------------------------------
// Inferred types
// ---------------------------------------------------------------------------
export type CreateProjectInput = z.infer<typeof createProjectSchema>['body'];
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>['body'];
export type ListProjectsQuery  = z.infer<typeof listProjectsSchema>['query'];