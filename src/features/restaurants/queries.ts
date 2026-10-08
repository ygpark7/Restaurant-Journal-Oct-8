import { keepPreviousData, useQuery } from '@tanstack/react-query';
import type { RestaurantFilters } from '@/domain/types';
import { useRepositories } from '@/lib/repositories-context';

export const restaurantKeys = {
  all: ['restaurants'] as const,
  search: (filters: RestaurantFilters) => ['restaurants', 'search', filters] as const,
  detail: (id: string) => ['restaurants', 'detail', id] as const,
};

export function useRestaurants(filters: RestaurantFilters) {
  const { restaurants } = useRepositories();
  return useQuery({
    queryKey: restaurantKeys.search(filters),
    queryFn: () => restaurants.search(filters),
    // Keep the old list on screen while a new filter loads, so the page doesn't flash.
    placeholderData: keepPreviousData,
  });
}

export function useRestaurant(id: string | undefined) {
  const { restaurants } = useRepositories();
  return useQuery({
    queryKey: restaurantKeys.detail(id ?? ''),
    queryFn: () => restaurants.getById(id!),
    enabled: !!id,
  });
}
