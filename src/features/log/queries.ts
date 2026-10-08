import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { NewVisit } from '@/domain/types';
import { useRepositories } from '@/lib/repositories-context';
import { restaurantKeys } from '@/features/restaurants/queries';
import { savedKeys } from '@/features/lists/queries';

export const visitKeys = {
  all: ['visits'] as const,
  byRestaurant: (id: string) => ['visits', 'restaurant', id] as const,
};

export function useRestaurantVisits(restaurantId: string | undefined) {
  const { visits } = useRepositories();
  return useQuery({
    queryKey: visitKeys.byRestaurant(restaurantId ?? ''),
    queryFn: () => visits.listByRestaurant(restaurantId!),
    enabled: !!restaurantId,
  });
}

/**
 * Logging a visit does two things: records the visit, then marks the place "Been there".
 * Doing both here (rather than inside a repository) keeps the rule independent of the
 * data source. Confirmed attributes change what restaurants look like, so those caches refresh.
 */
export function useLogVisit() {
  const { visits, savedPlaces } = useRepositories();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (visit: NewVisit) => {
      const created = await visits.create(visit);
      await savedPlaces.save(visit.restaurantId, 'been_there');
      return created;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: visitKeys.all });
      void queryClient.invalidateQueries({ queryKey: restaurantKeys.all });
      void queryClient.invalidateQueries({ queryKey: savedKeys.all });
    },
  });
}
