// src/hooks/useProjects.ts
import {
  useQuery,
  useMutation,
  useQueryClient,
  keepPreviousData,
} from '@tanstack/react-query';
import toast              from 'react-hot-toast';
import projectService     from '../services/projectService';
import type {
  CreateProjectPayload,
  UpdateProjectPayload,
  ListProjectsParams,
  Project,
} from '../types/index';

// ---------------------------------------------------------------------------
// Query key factory — keeps cache keys consistent and refactorable
// ---------------------------------------------------------------------------
export const projectKeys = {
  all:    ()         => ['projects']                     as const,
  lists:  ()         => ['projects', 'list']             as const,
  list:   (p: ListProjectsParams) => ['projects', 'list', p] as const,
  detail: (id: string) => ['projects', 'detail', id]    as const,
};

// ---------------------------------------------------------------------------
// useProjects — paginated project list
// ---------------------------------------------------------------------------
export function useProjects(params: ListProjectsParams = {}) {
  return useQuery({
    queryKey:    projectKeys.list(params),
    queryFn:     () => projectService.list(params),
    placeholderData: keepPreviousData,  // keeps previous page visible while next loads
    staleTime:   1000 * 60 * 2,        // 2 min — project lists don't change that fast
  });
}

// ---------------------------------------------------------------------------
// useProject — single project by ID
// ---------------------------------------------------------------------------
export function useProject(id: string) {
  return useQuery({
    queryKey: projectKeys.detail(id),
    queryFn:  () => projectService.getById(id),
    enabled:  Boolean(id),
    staleTime: 1000 * 60 * 5,
  });
}

// ---------------------------------------------------------------------------
// useCreateProject
// ---------------------------------------------------------------------------
export function useCreateProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateProjectPayload) =>
      projectService.create(payload),

    onSuccess: (newProject) => {
      // Invalidate the list so it re-fetches with the new project
      queryClient.invalidateQueries({ queryKey: projectKeys.lists() });

      // Optimistically seed the detail cache — avoids a network round-trip
      // if the user navigates to the project immediately after creation
      queryClient.setQueryData(projectKeys.detail(newProject._id), newProject);

      toast.success(`"${newProject.name}" created`);
    },

    onError: (error: { response?: { data?: { message?: string } } }) => {
      toast.error(error.response?.data?.message ?? 'Failed to create project');
    },
  });
}

// ---------------------------------------------------------------------------
// useUpdateProject
// ---------------------------------------------------------------------------
export function useUpdateProject(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpdateProjectPayload) =>
      projectService.update(id, payload),

    onMutate: async (payload) => {
      // Cancel any outgoing refetches to avoid overwriting the optimistic update
      await queryClient.cancelQueries({ queryKey: projectKeys.detail(id) });

      const previous = queryClient.getQueryData(projectKeys.detail(id));

      // Optimistic update
      queryClient.setQueryData<Project>(projectKeys.detail(id), (old) =>
        old ? { ...old, ...payload } as Project : old
      );

      return { previous };
    },

    onError: (_err, _payload, context) => {
      // Roll back on failure
      if (context?.previous) {
        queryClient.setQueryData(projectKeys.detail(id), context.previous);
      }
      toast.error('Failed to update project');
    },

    onSuccess: (updatedProject) => {
      queryClient.setQueryData(projectKeys.detail(id), updatedProject);
      queryClient.invalidateQueries({ queryKey: projectKeys.lists() });
      toast.success('Project updated');
    },
  });
}

// ---------------------------------------------------------------------------
// useArchiveProject
// ---------------------------------------------------------------------------
export function useArchiveProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => projectService.archive(id),

    onSuccess: (archivedProject) => {
      queryClient.setQueryData(
        projectKeys.detail(archivedProject._id),
        archivedProject
      );
      queryClient.invalidateQueries({ queryKey: projectKeys.lists() });
      toast.success(`"${archivedProject.name}" archived`);
    },

    onError: () => {
      toast.error('Failed to archive project');
    },
  });
}

// ---------------------------------------------------------------------------
// useDeleteProject
// ---------------------------------------------------------------------------
export function useDeleteProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => projectService.remove(id),

    onSuccess: (_data, id) => {
      queryClient.removeQueries({ queryKey: projectKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: projectKeys.lists() });
      toast.success('Project deleted');
    },

    onError: () => {
      toast.error('Failed to delete project');
    },
  });
}