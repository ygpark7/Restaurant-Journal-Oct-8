import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router';
import type { RestaurantFilters } from '@/domain/types';
import { countActiveFilters, parseFilters, writeFilters } from './filterParams';

/** Filter state backed by the URL. `update` merges a patch; pass undefined to clear a field. */
export function useFilterParams() {
  const [params, setParams] = useSearchParams();
  const filters = useMemo(() => parseFilters(params), [params]);

  const update = useCallback(
    (patch: Partial<RestaurantFilters>) => {
      setParams((prev) => writeFilters(prev, { ...parseFilters(prev), ...patch }), {
        replace: true,
      });
    },
    [setParams],
  );

  const clearAll = useCallback(() => {
    setParams((prev) => writeFilters(prev, {}), { replace: true });
  }, [setParams]);

  return { filters, update, clearAll, activeCount: countActiveFilters(filters) };
}
