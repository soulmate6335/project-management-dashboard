// src/middleware/error.middleware.ts
//
// Global error handler — must be registered LAST in app.ts.
// Catches everything forwarded via next(err).

import { Request, Response, NextFunction } from 'express';
import { Error as MongooseError } from 'mongoose';
import { MongoServerError } from 'mongodb';
import { ApiError } from '../utils/ApiError';
import logger from '../utils/logger';
import env from '../config/env';

// Shape every error response into the same envelope
interface ErrorResponse {
  success: false;
  message: string;
  code: string;
  errors?: Record<string, string[]>;
  stack?: string;
}

export function errorMiddleware(
  err: unknown,
  _req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction
): void {
  let statusCode = 500;
  let message    = 'Internal server error';
  let code       = 'INTERNAL_ERROR';
  let errors: Record<string, string[]> | undefined;

  // ── Known operational error ─────────────────────────────────────────────
  if (err instanceof ApiError) {
    statusCode = err.statusCode;
    message    = err.message;
    code       = err.code;
    errors     = err.errors;
  }

  // ── Mongoose validation error ────────────────────────────────────────────
  else if (err instanceof MongooseError.ValidationError) {
    statusCode = 422;
    message    = 'Validation failed';
    code       = 'VALIDATION_ERROR';
    errors = Object.fromEntries(
      Object.entries(err.errors).map(([field, e]) => [field, [e.message]])
    );
  }

  // ── Mongoose cast error (e.g. invalid ObjectId) ──────────────────────────
  else if (err instanceof MongooseError.CastError) {
    statusCode = 400;
    message    = `Invalid value for field "${err.path}"`;
    code       = 'CAST_ERROR';
  }

  // ── MongoDB duplicate key (e.g. unique email) ─────────────────────────────
  else if (err instanceof MongoServerError && err.code === 11000) {
    statusCode = 409;
    const field = Object.keys(err.keyValue ?? {})[0] ?? 'field';
    message    = `${field} already exists`;
    code       = 'DUPLICATE_KEY';
  }

  // ── JWT errors (forwarded from auth middleware) ───────────────────────────
  else if (err instanceof Error && err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message    = 'Invalid token';
    code       = 'INVALID_TOKEN';
  }
  else if (err instanceof Error && err.name === 'TokenExpiredError') {
    statusCode = 401;
    message    = 'Token expired';
    code       = 'TOKEN_EXPIRED';
  }

  // ── Unknown / programming error ───────────────────────────────────────────
  else if (err instanceof Error) {
    message = env.IS_PRODUCTION ? 'Internal server error' : err.message;
  }

  // Log 5xx errors with full stack; 4xx are operational, lower severity
  if (statusCode >= 500) {
    logger.error('[error] Unhandled server error', {
      statusCode,
      code,
      message,
      stack: err instanceof Error ? err.stack : undefined,
    });
  } else {
    logger.warn('[error] Client error', { statusCode, code, message });
  }

  const body: ErrorResponse = {
    success: false,
    message,
    code,
    ...(errors && { errors }),
    ...(!env.IS_PRODUCTION && err instanceof Error && { stack: err.stack }),
  };

  res.status(statusCode).json(body);
}