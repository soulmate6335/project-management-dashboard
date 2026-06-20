// src/app.ts [BACKEND]
//
// Express application factory.
// Exports the configured app — does NOT call app.listen().
// server.ts owns the HTTP server lifecycle so Socket.io can share it.

import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import mongoSanitize from 'express-mongo-sanitize';

import env from './config/env';
import logger from './utils/logger';
import { ApiError } from './utils/ApiError';
import { errorMiddleware } from './middleware/error.middleware';

// ---------------------------------------------------------------------------
// Route imports
// ---------------------------------------------------------------------------
import authRoutes    from './modules/auth/auth.routes';
//import userRoutes    from './modules/users/user.routes';
import projectRoutes from './modules/projects/project.routes';
import taskRoutes    from './modules/tasks/task.routes';   // ✅ uncommented
// import analyticsRoutes from './modules/analytics/analytics.routes';

// ---------------------------------------------------------------------------
// Factory function
// ---------------------------------------------------------------------------
export function createApp(): Application {
  const app = express();

  if (env.IS_PRODUCTION) {
    app.set('trust proxy', 1);
  }

  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    })
  );

  app.use(
    cors({
      origin: (origin, callback) => {
        if (!origin) return callback(null, true);
        const allowed = env.CLIENT_URL.split(',').map((u) => u.trim());
        if (allowed.includes(origin)) {
          callback(null, true);
        } else {
          callback(new ApiError(403, `CORS: origin "${origin}" not allowed`, 'CORS_BLOCKED'));
        }
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    })
  );

  app.use(
    '/api',
    rateLimit({
      windowMs: env.RATE_LIMIT_WINDOW_MS,
      max: env.RATE_LIMIT_MAX,
      standardHeaders: true,
      legacyHeaders: false,
      message: {
        success: false,
        message: 'Too many requests, please try again later.',
        code: 'RATE_LIMITED',
      },
      skip: () => env.IS_TEST,
    })
  );

  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));
  app.use(mongoSanitize());

  if (!env.IS_TEST) {
    app.use(
      morgan(env.IS_PRODUCTION ? 'combined' : 'dev', {
        stream: {
          write: (message: string) => logger.http(message.trim()),
        },
      })
    );
  }

  // ── Health check ──────────────────────────────────────────────────────────
  app.get('/', (_req, res) => {
    res.status(200).json({
      status: 'ProjectHub API running',
    });
  });

  app.get('/health', (_req: Request, res: Response) => {
    res.status(200).json({
      success: true,
      status: 'ok',
      environment: env.NODE_ENV,
      timestamp: new Date().toISOString(),
    });
  });

  // ── API routes ────────────────────────────────────────────────────────────
  app.use('/api/v1/auth',     authRoutes);
  // app.use('/api/v1/users', userRoutes);
  app.use('/api/v1/projects', projectRoutes);

  // ✅ Tasks nested under projects — mergeParams in task.routes.ts
  // gives handlers access to :projectId from this parent mount path
  app.use('/api/v1/projects/:projectId/tasks', taskRoutes);

  // app.use('/api/v1/analytics', analyticsRoutes);

  // ── 404 — unknown route ───────────────────────────────────────────────────
  app.use((req: Request, _res: Response, next: NextFunction) => {
    next(new ApiError(404, `Route not found: ${req.method} ${req.originalUrl}`, 'NOT_FOUND'));
  });

  // ── Global error handler (must be last) ───────────────────────────────────
  app.use(errorMiddleware);

  return app;
}