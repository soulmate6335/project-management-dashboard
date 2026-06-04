// src/types/express.d.ts
//
// Augments the Express Request interface so req.user is available
// throughout the app after the auth middleware runs — no casting needed.

import { Server as SocketIOServer } from 'socket.io';

declare global {
  namespace Express {
    interface Request {
      /** Attached by authMiddleware after JWT verification */
      user?: {
        id: string;
        email: string;
        role: 'admin' | 'member' | 'viewer';
      };
      /** Socket.io server instance — attached in server.ts */
      io?: SocketIOServer;
    }
  }
}

export {};