// src/middleware/validate.middleware.ts
import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError }             from 'zod';
import { ApiError }                        from '../utils/ApiError';

/**
 * Zod validation middleware factory.
 *
 * Validates req.body, req.params, and req.query against a schema that
 * follows the shape: z.object({ body?, params?, query? }).
 *
 * On success  — mutates req with the coerced/parsed values and calls next().
 * On failure  — calls next() with a 422 ApiError carrying field-level messages.
 *
 * Usage:
 *   router.post('/', validate(createProjectSchema), createProject);
 */
export function validate(schema: ZodSchema) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      const parsed = schema.parse({
        body:   req.body,
        params: req.params,
        query:  req.query,
      });

      // Write coerced values back so downstream handlers get the right types
      if (parsed.body)   req.body   = parsed.body;
      if (parsed.params) req.params = parsed.params;
      if (parsed.query)  req.query  = parsed.query;

      next();
    } catch (err) {
      if (err instanceof ZodError) {
        // Collapse Zod's issues into a { fieldName: [messages] } map
        const fieldErrors = err.errors.reduce<Record<string, string[]>>((acc, issue) => {
          // Strip the leading segment ('body', 'params', 'query') from the path
          const segments = issue.path.slice(1);
          const key      = segments.length ? segments.join('.') : '_root';
          if (!acc[key]) acc[key] = [];
          acc[key]!.push(issue.message);
          return acc;
        }, {});

        next(ApiError.badRequest('Validation failed', fieldErrors));
      } else {
        next(err);
      }
    }
  };
}