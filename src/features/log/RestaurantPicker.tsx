import { useState } from 'react';
import { Button } from '@/components/Button';
import { ErrorState } from '@/components/ErrorState';
import { Icon } from '@/components/Icon';
import { Skeleton } from '@/components/Skeleton';
import { useRestaurant, useRestaurants } from '@/features/restaurants/queries';

/** Pick the place: a search box with the top matches as big tappable rows. */
export function RestaurantPicker({
  value,
  onChange,
  error,
}: {
  value: string;
  onChange: (id: string) => void;
  error?: string;
}) {
  const [query, setQuery] = useState('');
  const selected = useRestaurant(value || undefined);
  const results = useRestaurants({ query });

  if (value && selected.data) {
    return (
      <div className="flex items-center justify-between gap-3 rounded-card bg-sage-50 p-4 ring-2 ring-sage-600">
        <div className="min-w-0">
          <p className="text-sm font-medium text-sage-700">Where did you go?</p>
          <p className="truncate text-lg font-semibold">{selected.data.name}</p>
          <p className="truncate text-ink-500">
            {selected.data.neighborhood} · {selected.data.cuisine}
          </p>
        </div>
        <Button variant="secondary" onClick={() => onChange('')}>
          Change
        </Button>
      </div>
    );
  }

  if (value && selected.isPending) return <Skeleton className="h-24 rounded-card" />;
  if (value && selected.isError) {
    return (
      <ErrorState
        title="We couldn't load that place"
        onRetry={() => void selected.refetch()}
      />
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <label htmlFor="place-search" className="text-base font-semibold">
        Where did you go?
      </label>
      <div className="relative">
        <Icon
          name="search"
          className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink-500"
        />
        <input
          id="place-search"
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search restaurants"
          autoComplete="off"
          aria-describedby={error ? 'place-error' : undefined}
          className="h-12 w-full rounded-full border-2 border-cream-300 bg-cream-50 pl-12 pr-4 text-base placeholder:text-ink-500 focus:border-sage-600"
        />
      </div>
      {error && (
        <p id="place-error" role="alert" className="text-sm font-medium text-rose-600">
          {error}
        </p>
      )}

      {results.isPending ? (
        <div role="status" className="flex flex-col gap-2">
          <span className="sr-only">Loading restaurants…</span>
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-14 rounded-2xl" />
          ))}
        </div>
      ) : results.isError ? (
        <ErrorState
          title="We couldn't load restaurants"
          onRetry={() => void results.refetch()}
        />
      ) : results.data.length === 0 ? (
        <p className="rounded-card bg-cream-50 p-4 text-ink-500">
          No places match &ldquo;{query}&rdquo;.
        </p>
      ) : (
        <ul className="flex max-h-72 flex-col gap-2 overflow-y-auto">
          {results.data.slice(0, 8).map((r) => (
            <li key={r.id}>
              <button
                type="button"
                onClick={() => onChange(r.id)}
                className="flex min-h-14 w-full flex-col justify-center rounded-2xl border-2 border-cream-300 bg-cream-50 px-4 py-2 text-left hover:border-sage-600"
              >
                <span className="font-semibold">{r.name}</span>
                <span className="text-sm text-ink-500">
                  {r.neighborhood} · {r.cuisine}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
