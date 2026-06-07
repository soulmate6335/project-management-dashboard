// src/sockets/socket.ts [FRONTEND]
import { io, Socket } from 'socket.io-client';

const BASE_URL = import.meta.env.VITE_API_URL;

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    socket = io(BASE_URL, {
      transports:       ['websocket', 'polling'],
      autoConnect:      false,
      withCredentials:  true,
    });
  }
  return socket;
}

export function connectSocket(token: string): void {
  const s = getSocket();
  s.auth = { token };
  if (!s.connected) s.connect();
}

export function disconnectSocket(): void {
  if (socket?.connected) {
    socket.disconnect();
  }
}

export function joinProjectRoom(projectId: string): void {
  getSocket().emit('project:join', { projectId });
}

export function leaveProjectRoom(projectId: string): void {
  getSocket().emit('project:leave', { projectId });
}

export default getSocket;