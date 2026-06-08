// src/app.ts
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
// Route imports (add as you build each module)
// ---------------------------------------------------------------------------
 import authRoutes    from './modules/auth/auth.routes';
 //import userRoutes    from './modules/users/user.routes';
 import projectRoutes from './modules/projects/project.routes';
// import taskRoutes    from './modules/tasks/task.routes';
// import analyticsRoutes from './modules/analytics/analytics.routes';

// ---------------------------------------------------------------------------
// Factory function
// ---------------------------------------------------------------------------
export function createApp(): Application {
  const app = express();

  // ── Trust proxy (required when behind Nginx / load balancer) ─────────────
  if (env.IS_PRODUCTION) {
    app.set('trust proxy', 1);
  }

  // ── Security headers ──────────────────────────────────────────────────────
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    })
  );

  // ── CORS ──────────────────────────────────────────────────────────────────
  app.use(
    cors({
      origin: (origin, callback) => {
        // Allow requests with no origin (mobile apps, Postman, curl)
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

  // ── Global rate limiter ───────────────────────────────────────────────────
  app.use(
    '/api',
    rateLimit({
      windowMs: env.RATE_LIMIT_WINDOW_MS,
      max: env.RATE_LIMIT_MAX,
      standardHeaders: true,  // Return rate limit info in `RateLimit-*` headers
      legacyHeaders: false,
      message: {
        success: false,
        message: 'Too many requests, please try again later.',
        code: 'RATE_LIMITED',
      },
      skip: () => env.IS_TEST,
    })
  );

  // ── Body parsers ──────────────────────────────────────────────────────────
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // ── NoSQL injection sanitiser ─────────────────────────────────────────────
  app.use(mongoSanitize());

  // ── HTTP request logging ──────────────────────────────────────────────────
  if (!env.IS_TEST) {
    app.use(
      morgan(env.IS_PRODUCTION ? 'combined' : 'dev', {
        stream: {
          write: (message: string) => logger.http(message.trim()),
        },
      })
    );
  }

  // ── Attach Socket.io to request (injected by server.ts) ──────────────────
  // Downstream controllers can access req.io to emit events
  // app.use((req, _res, next) => { req.io = io; next(); });
  // (wired in server.ts after Socket.io is instantiated)

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
   app.use('/api/v1/auth',      authRoutes);
  // app.use('/api/v1/users',     userRoutes);
   app.use('/api/v1/projects',  projectRoutes);
  // app.use('/api/v1/tasks',     taskRoutes);
  // app.use('/api/v1/analytics', analyticsRoutes);

  // ── 404 — unknown route ───────────────────────────────────────────────────
  app.use((req: Request, _res: Response, next: NextFunction) => {
    next(new ApiError(404, `Route not found: ${req.method} ${req.originalUrl}`, 'NOT_FOUND'));
  });

  // ── Global error handler (must be last) ───────────────────────────────────
  app.use(errorMiddleware);

  return app;
}