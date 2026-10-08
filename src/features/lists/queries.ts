import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { SavedPlace, SavedStatus } from '@/domain/types';
import { useRepositories } from '@/lib/repositories-context';

export const savedKeys = {
  all: ['saved'] as const,
  list: () => ['saved', 'list'] as const,
  one: (restaurantId: string) => ['saved', 'one', restaurantId] as const,
};

/** Everything the user has saved; callers split it by status (one request, free tab counts). */
export function useSavedPlaces() {
  const { savedPlaces } = useRepositories();
  return useQuery({ queryKey: savedKeys.list(), queryFn: () => savedPlaces.list() });
}

export function useSavedPlace(restaurantId: string) {
  const { savedPlaces } = useRepositories();
  return useQuery({
    queryKey: savedKeys.one(restaurantId),
    queryFn: () => savedPlaces.get(restaurantId),
  });
}

/** Save or un-save a place. Updates the button instantly and rolls back if the request fails. */
export function useToggleSaved(restaurantId: string) {
  const { savedPlaces } = useRepositories();
  const queryClient = useQueryClient();
  const key = savedKeys.one(restaurantId);

  return useMutation({
    mutationFn: async (next: SavedStatus | null) => {
      if (next) await savedPlaces.save(restaurantId, next);
      else await savedPlaces.remove(restaurantId);
    },
    onMutate: async (next) => {
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<SavedPlace | null>(key);
      const optimistic: SavedPlace | null = next
        ? {
            userId: previous?.userId ?? 'me',
            restaurantId,
            status: next,
            createdAt: previous?.createdAt ?? new Date().toISOString(),
          }
        : null;
      queryClient.setQueryData<SavedPlace | null>(key, optimistic);
      return { previous };
    },
    onError: (_error, _next, context) => {
      queryClient.setQueryData(key, context?.previous ?? null);
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: savedKeys.all });
    },
  });
}

export function useRemoveSaved() {
  const { savedPlaces } = useRepositories();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (restaurantId: string) => savedPlaces.remove(restaurantId),
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: savedKeys.all });
    },
  });
}
