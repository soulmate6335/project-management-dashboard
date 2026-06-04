// src/server.ts
//
// Entry point. Owns the HTTP server lifecycle:
//   1. Validate env (throws fast if config is broken)
//   2. Connect to MongoDB
//   3. Create Express app
//   4. Attach Socket.io to the HTTP server
//   5. Bind and listen
//   6. Handle uncaught errors + graceful shutdown

import http from 'http';
import { Server as SocketIOServer } from 'socket.io';

import env from './config/env';
import { connectDB } from './config/db';
import { createApp } from './app';
import logger from './utils/logger';

// ---------------------------------------------------------------------------
// Unhandled rejection / exception guards
// Must be registered before any async work starts.
// ---------------------------------------------------------------------------
process.on('uncaughtException', (err: Error) => {
  logger.error('[server] Uncaught exception — shutting down', {
    message: err.message,
    stack: err.stack,
  });
  process.exit(1);
});

process.on('unhandledRejection', (reason: unknown) => {
  logger.error('[server] Unhandled promise rejection — shutting down', { reason });
  process.exit(1);
});

// ---------------------------------------------------------------------------
// Bootstrap
// ---------------------------------------------------------------------------
async function bootstrap(): Promise<void> {
  // 1. Connect to MongoDB before accepting HTTP traffic
  await connectDB();

  // 2. Build Express app (middleware + routes wired inside)
  const app = createApp();

  // 3. Create HTTP server (shared between Express and Socket.io)
  const httpServer = http.createServer(app);

  // 4. Attach Socket.io ─────────────────────────────────────────────────────
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: env.CLIENT_URL.split(',').map((u) => u.trim()),
      methods: ['GET', 'POST'],
      credentials: true,
    },
    // Ping timeout / interval — tune for your network
    pingTimeout: 20_000,
    pingInterval: 10_000,
    // Use websockets first, fall back to polling
    transports: ['websocket', 'polling'],
  });

  // Make io accessible in Express controllers via req.io
  app.use((req, _res, next) => {
    req.io = io;
    next();
  });

  // ── Socket.io namespace / event wiring ─────────────────────────────────
  // Uncomment as you build each socket module:
  // import { registerProjectSockets }      from './sockets/project.socket';
  // import { registerTaskSockets }         from './sockets/task.socket';
  // import { registerNotificationSockets } from './sockets/notification.socket';

  io.on('connection', (socket) => {
    logger.debug(`[socket] Client connected: ${socket.id}`);

    // registerProjectSockets(io, socket);
    // registerTaskSockets(io, socket);
    // registerNotificationSockets(io, socket);

    socket.on('disconnect', (reason) => {
      logger.debug(`[socket] Client disconnected: ${socket.id} — ${reason}`);
    });
  });

  // 5. Start listening ───────────────────────────────────────────────────────
  httpServer.listen(env.PORT, () => {
    logger.info(`[server] Running in ${env.NODE_ENV} mode`);
    logger.info(`[server] HTTP  → http://localhost:${env.PORT}`);
    logger.info(`[server] WS    → ws://localhost:${env.PORT}`);
    logger.info(`[server] Health → http://localhost:${env.PORT}/health`);
  });

  // 6. Graceful shutdown ─────────────────────────────────────────────────────
  //    db.ts handles SIGINT/SIGTERM for Mongoose;
  //    here we close the HTTP server cleanly first.
  const shutdown = (signal: string) => {
    logger.info(`[server] ${signal} received — starting graceful shutdown`);

    httpServer.close((err) => {
      if (err) {
        logger.error('[server] Error closing HTTP server', { err });
        process.exit(1);
      }
      logger.info('[server] HTTP server closed');
      // Mongoose connection close is handled by db.ts shutdown hooks
      process.exit(0);
    });

    // Force-kill if server hasn't closed within 10 s
    setTimeout(() => {
      logger.error('[server] Shutdown timeout — forcing exit');
      process.exit(1);
    }, 10_000).unref();
  };

  process.once('SIGTERM', () => shutdown('SIGTERM'));
  process.once('SIGINT',  () => shutdown('SIGINT'));
}

// ---------------------------------------------------------------------------
// Run
// ---------------------------------------------------------------------------
bootstrap().catch((err: unknown) => {
  logger.error('[server] Fatal error during bootstrap', { err });
  process.exit(1);
});