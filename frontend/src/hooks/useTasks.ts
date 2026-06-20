// src/hooks/useTasks.ts [FRONTEND]
import {
  useQuery,
  useMutation,
  useQueryClient,
  keepPreviousData,
} from '@tanstack/react-query';
import toast          from 'react-hot-toast';
import taskService    from '../services/taskService';
import type {
  Task,
  CreateTaskPayload,
  UpdateTaskPayload,
  TaskStatus,
  ListTasksParams,
  ReorderTasksPayload,
} from '../types';

// ---------------------------------------------------------------------------
// Query key factory
// ---------------------------------------------------------------------------
export const taskKeys = {
  all:     ()                            => ['tasks']                              as const,
  lists:   (projectId: string)           => ['tasks', projectId, 'list']           as const,
  list:    (projectId: string, p: ListTasksParams) =>
                                            ['tasks', projectId, 'list', p]        as const,
  detail:  (projectId: string, id: string) => ['tasks', projectId, 'detail', id]  as const,
  summary: (projectId: string)           => ['tasks', projectId, 'summary']        as const,
};

// ---------------------------------------------------------------------------
// useTaskSummary — status counts for a project
// ---------------------------------------------------------------------------
export function useTaskSummary(projectId: string) {
  return useQuery({
    queryKey: taskKeys.summary(projectId),
    queryFn:  () => taskService.getSummary(projectId),
    enabled:  Boolean(projectId),
    staleTime: 1000 * 60 * 1, // 1 min — summary used in dashboard stats
  });
}

// ---------------------------------------------------------------------------
// useTasks — task list for a project with optional filters
// ---------------------------------------------------------------------------
export function useTasks(projectId: string, params: ListTasksParams = {}) {
  return useQuery({
    queryKey:    taskKeys.list(projectId, params),
    queryFn:     () => taskService.list(projectId, params),
    enabled:     Boolean(projectId),
    placeholderData: keepPreviousData,
    staleTime:   1000 * 30, // 30 s — tasks change frequently
  });
}

// ---------------------------------------------------------------------------
// useTask — single task
// ---------------------------------------------------------------------------
export function useTask(projectId: string, taskId: string) {
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: taskKeys.detail(projectId, taskId),
    queryFn:  () => taskService.getById(projectId, taskId),
    enabled:  Boolean(projectId && taskId),

    // Seed from the list cache while the detail request is in flight
    initialData: () => {
      const lists = queryClient.getQueriesData<{ data: Task[] }>({
        queryKey: taskKeys.lists(projectId),
      });
      for (const [, listData] of lists) {
        const found = listData?.data?.find((t) => t._id === taskId);
        if (found) return found;
      }
      return undefined;
    },
  });
}

// ---------------------------------------------------------------------------
// useCreateTask
// ---------------------------------------------------------------------------
export function useCreateTask(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateTaskPayload) =>
      taskService.create(projectId, payload),

    onSuccess: (newTask) => {
      queryClient.invalidateQueries({ queryKey: taskKeys.lists(projectId) });
      queryClient.invalidateQueries({ queryKey: taskKeys.summary(projectId) });
      queryClient.setQueryData(
        taskKeys.detail(projectId, newTask._id),
        newTask
      );
      toast.success('Task created');
    },

    onError: (error: { response?: { data?: { message?: string } } }) => {
      toast.error(error.response?.data?.message ?? 'Failed to create task');
    },
  });
}

// ---------------------------------------------------------------------------
// useUpdateTask — fixed to a single task, with optimistic update
// Used by EditTaskDialog where the same task is being edited via a form.
// ---------------------------------------------------------------------------
export function useUpdateTask(projectId: string, taskId: string) {
  const queryClient = useQueryClient();
  const detailKey   = taskKeys.detail(projectId, taskId);

  return useMutation({
    mutationFn: (payload: UpdateTaskPayload) =>
      taskService.update(projectId, taskId, payload),

    onMutate: async (payload) => {
      await queryClient.cancelQueries({ queryKey: detailKey });
      const previous = queryClient.getQueryData<Task | undefined>(detailKey);
      queryClient.setQueryData<Task | undefined>(detailKey, (old) =>
        old ? ({ ...old, ...payload } as Task) : old
      );
      return { previous };
    },

    onError: (_err, _payload, context) => {
      if (context?.previous) {
        queryClient.setQueryData(detailKey, context.previous);
      }
      toast.error('Failed to update task');
    },

    onSuccess: (updatedTask) => {
      queryClient.setQueryData(detailKey, updatedTask);
      queryClient.invalidateQueries({ queryKey: taskKeys.lists(projectId) });
      // If status changed, refresh the summary counts
      queryClient.invalidateQueries({ queryKey: taskKeys.summary(projectId) });
    },
  });
}

// ---------------------------------------------------------------------------
// useUpdateTaskStatus — generic status update for drag-and-drop
// Unlike useUpdateTask, this does NOT fix a taskId at hook-call time.
// The drag handler can call mutate({ taskId, status }) for whichever
// card was just dropped, without needing one hook instance per task.
// ---------------------------------------------------------------------------
export function useUpdateTaskStatus(projectId: string) {
  const queryClient = useQueryClient();
  const listKey     = taskKeys.lists(projectId);
  const summaryKey  = taskKeys.summary(projectId);

  return useMutation({
    mutationFn: ({ taskId, status }: { taskId: string; status: TaskStatus }) =>
      taskService.update(projectId, taskId, { status }),

    onMutate: async ({ taskId, status }) => {
      await queryClient.cancelQueries({ queryKey: listKey });
      const previous = queryClient.getQueryData<{ data: Task[] }>(listKey);

      // Optimistically move the card to its new column immediately,
      // so the UI feels instant instead of waiting on the network.
      queryClient.setQueryData<{ data: Task[] } | undefined>(listKey, (old) => {
        if (!old) return old;
        return {
          ...old,
          data: old.data.map((t) =>
            t._id === taskId ? { ...t, status } : t
          ),
        };
      });

      return { previous };
    },

    onError: (_err, _payload, context) => {
      if (context?.previous) {
        queryClient.setQueryData(listKey, context.previous);
      }
      toast.error('Failed to move task');
    },

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: listKey });
      queryClient.invalidateQueries({ queryKey: summaryKey });
    },
  });
}

// ---------------------------------------------------------------------------
// useDeleteTask
// ---------------------------------------------------------------------------
export function useDeleteTask(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (taskId: string) => taskService.remove(projectId, taskId),

    onSuccess: (_data, taskId) => {
      queryClient.removeQueries({
        queryKey: taskKeys.detail(projectId, taskId),
      });
      queryClient.invalidateQueries({ queryKey: taskKeys.lists(projectId) });
      queryClient.invalidateQueries({ queryKey: taskKeys.summary(projectId) });
      toast.success('Task deleted');
    },

    onError: () => {
      toast.error('Failed to delete task');
    },
  });
}

// ---------------------------------------------------------------------------
// useReorderTasks — silent mutation, no toast
// Fires after every drag-and-drop drop event (within-column reordering)
// ---------------------------------------------------------------------------
export function useReorderTasks(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: ReorderTasksPayload) =>
      taskService.reorder(projectId, payload),

    onMutate: async ({ tasks }) => {
      await queryClient.cancelQueries({ queryKey: taskKeys.lists(projectId) });

      const orderMap = new Map(tasks.map(({ id, order }) => [id, order]));

      queryClient.setQueriesData<{ data: Task[]; meta: unknown }>(
        { queryKey: taskKeys.lists(projectId) },
        (old) => {
          if (!old) return old;
          return {
            ...old,
            data: old.data
              .map((t) =>
                orderMap.has(t._id) ? { ...t, order: orderMap.get(t._id)! } : t
              )
              .sort((a, b) => a.order - b.order),
          };
        }
      );
    },

    onError: () => {
      queryClient.invalidateQueries({ queryKey: taskKeys.lists(projectId) });
      toast.error('Failed to save new order');
    },
  });
}