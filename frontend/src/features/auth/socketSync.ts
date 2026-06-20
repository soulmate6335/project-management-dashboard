// src/features/auth/socketSync.ts [FRONTEND]
import { getSocket } from '../../services/socketClient';

export function syncSocketToken(token?: string | null) {
  const socket = getSocket();
  if (!socket) return;

  const finalToken = token || localStorage.getItem('auth_token');
  if (!finalToken) {
    socket.disconnect();
    return;
  }

  socket.auth = { token: finalToken };
  if (!socket.connected) {
    socket.connect();
  } else {
    socket.disconnect();
    socket.connect();
  }
} 