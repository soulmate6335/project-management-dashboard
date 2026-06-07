import { useQuery } from '@tanstack/react-query';

export function useAnalytics(projectId: string) {
  return useQuery({
    queryKey: ['analytics', projectId],
    queryFn: async () => {
      const res = await fetch(`/projects/${projectId}/analytics`);
      if (!res.ok) throw new Error('Network response was not ok');
      return res.json();
    },
    enabled: !!projectId,
  });
}