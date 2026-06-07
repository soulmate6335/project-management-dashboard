// src/server.ts [BACKEND]
import http            from 'http';
import { Server as SocketIOServer } from 'socket.io';
import env             from './config/env';
import { connectDB }   from './config/db';
import { createApp }   from './app';
import { initSockets } from './sockets/socket.manager';
import logger          from './utils/logger';

process.on('uncaughtException',  (err) => { logger.error('[server] Uncaught exception', { err }); process.exit(1); });
process.on('unhandledRejection', (reason) => { logger.error('[server] Unhandled rejection', { reason }); process.exit(1); });

async function bootstrap(): Promise<void> {
  await connectDB();

  const app        = createApp();
  const httpServer = http.createServer(app);

  const io = new SocketIOServer(httpServer, {
    cors: {
      origin:      env.CLIENT_URL.split(',').map((u) => u.trim()),
      methods:     ['GET', 'POST'],
      credentials: true,
    },
    transports: ['websocket', 'polling'],
    pingTimeout:  20_000,
    pingInterval: 10_000,
  });

  // Attach io to every request so controllers can emit events
  app.use((req, _res, next) => { req.io = io; next(); });

  // Wire all socket events
  initSockets(io);

  httpServer.listen(env.PORT, () => {
    logger.info(`[server] ${env.NODE_ENV} | http://localhost:${env.PORT}`);
    logger.info(`[server] Health → http://localhost:${env.PORT}/health`);
  });

  const shutdown = (signal: string) => {
    logger.info(`[server] ${signal} — shutting down`);
    httpServer.close(() => process.exit(0));
    setTimeout(() => process.exit(1), 10_000).unref();
  };

  process.once('SIGTERM', () => shutdown('SIGTERM'));
  process.once('SIGINT',  () => shutdown('SIGINT'));
}

bootstrap().catch((err) => { logger.error('[server] Bootstrap failed', { err }); process.exit(1); });