// src/server.ts [BACKEND]
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';

import env from './config/env';
import { connectDB } from './config/db';
import { createApp } from './app';
import { initSockets } from './sockets/socket.manager';
import logger from './utils/logger';

process.on('uncaughtException', (err) => {
  logger.error('[server] Uncaught exception', { err });
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  logger.error('[server] Unhandled rejection', { reason });
  process.exit(1);
});

async function bootstrap(): Promise<void> {
  await connectDB();

  const app = createApp();
  const httpServer = http.createServer(app);

  // -------------------------------------------------------------------------
  // Socket.IO setup
  // -------------------------------------------------------------------------
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: env.CLIENT_URL
        ? env.CLIENT_URL.split(',').map((u) => u.trim())
        : '*',
      methods: ['GET', 'POST', 'PATCH', 'DELETE'],
      credentials: true,
    },
    transports: ['websocket', 'polling'],
    pingTimeout: 20000,
    pingInterval: 10000,
  });

  // Make io available in all routes/controllers
  app.use((req, _res, next) => {
    (req as any).io = io;
    next();
  });

  // Initialize socket events (rooms, listeners, etc.)
  initSockets(io);

  // -------------------------------------------------------------------------
  // Start server
  // -------------------------------------------------------------------------
  httpServer.listen(env.PORT, () => {
    logger.info(`[server] ${env.NODE_ENV} | http://localhost:${env.PORT}`);
    logger.info(`[server] Health → http://localhost:${env.PORT}/health`);
  });

  // -------------------------------------------------------------------------
  // Graceful shutdown
  // -------------------------------------------------------------------------
  const shutdown = (signal: string) => {
    logger.info(`[server] ${signal} — shutting down`);

    io.close(() => {
      logger.info('[server] Socket.IO closed');
    });

    httpServer.close(() => {
      logger.info('[server] HTTP server closed');
      process.exit(0);
    });

    setTimeout(() => {
      logger.error('[server] Force shutdown');
      process.exit(1);
    }, 10000).unref();
  };

  process.once('SIGTERM', () => shutdown('SIGTERM'));
  process.once('SIGINT', () => shutdown('SIGINT'));
}

bootstrap().catch((err) => {
  logger.error('[server] Bootstrap failed', { err });
  process.exit(1);
});