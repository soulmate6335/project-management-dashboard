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
    // safer reconnect pattern
    socket.disconnect();
    socket.connect();
  }
}









