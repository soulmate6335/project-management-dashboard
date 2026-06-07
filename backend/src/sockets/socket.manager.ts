// src/sockets/socket.manager.ts [BACKEND]
import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import env from '../config/env';
import logger from '../utils/logger';

interface JwtPayload {
  id: string;
  email: string;
  role: string;
}

// ---------------------------------------------------------------------------
// Auth middleware (socket handshake)
// ---------------------------------------------------------------------------
function authMiddleware(socket: Socket, next: (err?: Error) => void): void {
  const token =
    socket.handshake.auth?.token ||
    socket.handshake.headers?.authorization?.replace('Bearer ', '');

  if (!token) return next(new Error('Authentication required'));

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as JwtPayload;

    socket.data.user = decoded; // ✅ FIX: no extra casting everywhere
    next();
  } catch {
    next(new Error('Invalid or expired token'));
  }
}

// ---------------------------------------------------------------------------
// Events
// ---------------------------------------------------------------------------
function registerEvents(io: Server, socket: Socket): void {
  const user = socket.data.user as JwtPayload;

  if (!user) {
    socket.disconnect();
    return;
  }

  const userId = user.id;

  logger.debug(`[socket] User connected: ${userId} (${socket.id})`);

  // personal room
  socket.join(`user:${userId}`);

  // join project room
  socket.on('project:join', (projectId: string) => {
    socket.join(`project:${projectId}`);
    logger.debug(`[socket] ${userId} joined project:${projectId}`);
  });

  // leave project room
  socket.on('project:leave', (projectId: string) => {
    socket.leave(`project:${projectId}`);
  });

  socket.on('disconnect', (reason) => {
    logger.debug(`[socket] ${userId} disconnected — ${reason}`);
  });
}

// ---------------------------------------------------------------------------
// Emitters (used in controllers/services)
// ---------------------------------------------------------------------------
export const emitTaskCreated = (io: Server, projectId: string, task: unknown) => {
  io.to(`project:${projectId}`).emit('task:created', task);
};

export const emitTaskUpdated = (io: Server, projectId: string, task: unknown) => {
  io.to(`project:${projectId}`).emit('task:updated', task);
};

export const emitTaskDeleted = (io: Server, projectId: string, taskId: string) => {
  io.to(`project:${projectId}`).emit('task:deleted', { taskId });
};

export const emitProjectUpdated = (io: Server, projectId: string, project: unknown) => {
  io.to(`project:${projectId}`).emit('project:updated', project);
};

export const emitNotification = (
  io: Server,
  userId: string,
  notification: unknown
) => {
  io.to(`user:${userId}`).emit('notification:new', notification);
};

// ---------------------------------------------------------------------------
// Init
// ---------------------------------------------------------------------------
export function initSockets(io: Server): void {
  io.use(authMiddleware);
  io.on('connection', (socket) => registerEvents(io, socket));

  logger.info('[socket] Socket.io initialised');
}