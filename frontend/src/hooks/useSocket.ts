// src/hooks/useSocket.ts [FRONTEND]
import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
// ✅ Correct
import { connectSocket, disconnectSocket, joinProjectRoom, leaveProjectRoom, getSocket } from "../sockets/socket";
import { useAppSelector } from '../app/hooks';
import { selectAuthToken } from '../features/auth/store/authSlice';
import { taskKeys } from './useTasks';
import { projectKeys } from './useProjects';
import type { Task, Project } from '../types';

// ---------------------------------------------------------------------------
// useSocketConnection — call once in App root after login
// ---------------------------------------------------------------------------
export function useSocketConnection() {
  const token = useAppSelector(selectAuthToken) as string | null;

  useEffect(() => {
    if (!token) return;
    connectSocket(token);
    return () => { disconnectSocket(); };
  }, [token]);
}

// ---------------------------------------------------------------------------
// useProjectSocket — subscribe to real-time events for a project room
// ---------------------------------------------------------------------------
export function useProjectSocket(projectId: string) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!projectId) return;
    const socket = getSocket();

    joinProjectRoom(projectId);

    // Task created — add to list cache
    socket.on('task:created', (task: Task) => {
      queryClient.invalidateQueries({ queryKey: taskKeys.lists(projectId) });
      queryClient.setQueryData(taskKeys.detail(projectId, task._id), task);
    });

    // Task updated — update in place
    socket.on('task:updated', (task: Task) => {
      queryClient.setQueryData(taskKeys.detail(projectId, task._id), task);
      queryClient.invalidateQueries({ queryKey: taskKeys.lists(projectId) });
      queryClient.invalidateQueries({ queryKey: taskKeys.summary(projectId) });
    });

    // Task deleted — remove from cache
    socket.on('task:deleted', ({ taskId }: { taskId: string }) => {
      queryClient.removeQueries({ queryKey: taskKeys.detail(projectId, taskId) });
      queryClient.invalidateQueries({ queryKey: taskKeys.lists(projectId) });
      queryClient.invalidateQueries({ queryKey: taskKeys.summary(projectId) });
    });

    // Project updated
    socket.on('project:updated', (project: Project) => {
      queryClient.setQueryData(projectKeys.detail(project._id), project);
      queryClient.invalidateQueries({ queryKey: projectKeys.lists() });
    });

    return () => {
      leaveProjectRoom(projectId);
      socket.off('task:created');
      socket.off('task:updated');
      socket.off('task:deleted');
      socket.off('project:updated');
    };
  }, [projectId, queryClient]);
}