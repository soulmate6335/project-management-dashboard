// src/sockets/socket.manager.ts [BACKEND]
import { Server, Socket }  from 'socket.io';
import jwt                 from 'jsonwebtoken';
import env                 from '../config/env';
import logger              from '../utils/logger';

interface JwtPayload { id: string; email: string; role: string; }

// ---------------------------------------------------------------------------
// Auth handshake — verify JWT on every socket connection
// ---------------------------------------------------------------------------
function authMiddleware(socket: Socket, next: (err?: Error) => void): void {
  const token =
    (socket.handshake.auth as { token?: string }).token ??
    socket.handshake.headers.authorization?.replace('Bearer ', '');

  if (!token) return next(new Error('Authentication required'));

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as JwtPayload;
    (socket.data as { user: JwtPayload }).user = decoded;
    next();
  } catch {
    next(new Error('Invalid or expired token'));
  }
}

// ---------------------------------------------------------------------------
// Event registration
// ---------------------------------------------------------------------------
function registerEvents(io: Server, socket: Socket): void {
  const userId = (socket.data as { user: JwtPayload }).user.id;
  logger.debug(`[socket] User connected: ${userId} (${socket.id})`);

  // Join personal notification room
  void socket.join(`user:${userId}`);

  // ── Project rooms ────────────────────────────────────────────────────
  socket.on('project:join', ({ projectId }: { projectId: string }) => {
    void socket.join(`project:${projectId}`);
    logger.debug(`[socket] ${userId} joined project:${projectId}`);
  });

  socket.on('project:leave', ({ projectId }: { projectId: string }) => {
    void socket.leave(`project:${projectId}`);
  });

  socket.on('disconnect', (reason) => {
    logger.debug(`[socket] ${userId} disconnected — ${reason}`);
  });
}

// ---------------------------------------------------------------------------
// Public emitter helpers — used by controllers to broadcast events
// ---------------------------------------------------------------------------
export function emitTaskCreated(io: Server, projectId: string, task: unknown): void {
  io.to(`project:${projectId}`).emit('task:created', task);
}

export function emitTaskUpdated(io: Server, projectId: string, task: unknown): void {
  io.to(`project:${projectId}`).emit('task:updated', task);
}

export function emitTaskDeleted(io: Server, projectId: string, taskId: string): void {
  io.to(`project:${projectId}`).emit('task:deleted', { taskId });
}

export function emitProjectUpdated(io: Server, projectId: string, project: unknown): void {
  io.to(`project:${projectId}`).emit('project:updated', project);
}

export function emitNotification(io: Server, userId: string, notification: unknown): void {
  io.to(`user:${userId}`).emit('notification:new', notification);
}

// ---------------------------------------------------------------------------
// Bootstrap — called in server.ts
// ---------------------------------------------------------------------------
export function initSockets(io: Server): void {
  io.use(authMiddleware);
  io.on('connection', (socket) => registerEvents(io, socket));
  logger.info('[socket] Socket.io initialised');
}