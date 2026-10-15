import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/Button';
import { Chip } from '@/components/Chip';
import { EmptyState } from '@/components/EmptyState';
import { ErrorState } from '@/components/ErrorState';
import { Icon } from '@/components/Icon';
import { Skeleton } from '@/components/Skeleton';
import { ATTRIBUTE_DEFS } from '@/domain/attributes.config';
import { isGoodForTonight } from '@/domain/filterRestaurants';
import { cn } from '@/lib/cn';
import { useNow } from '@/lib/useNow';
import { FilterSheet } from './FilterSheet';
import { hasAnyFilter, toggleInList } from './filterParams';
import { RestaurantCard } from './RestaurantCard';
import { useFilterParams } from './useFilterParams';
import { useRestaurants } from './queries';

const QUICK_FILTERS = ATTRIBUTE_DEFS.filter(
  (d) => d.kind === 'boolean' && d.showInQuickFilters,
);

function SearchBox({
  value,
  onCommit,
}: {
  value: string;
  onCommit: (text: string) => void;
}) {
  const [text, setText] = useState(value);
  const committed = useRef(value);

  // Debounce so we don't hit the data layer on every keystroke.
  useEffect(() => {
    if (text.trim() === value.trim()) return;
    const id = setTimeout(() => {
      committed.current = text;
      onCommit(text);
    }, 250);
    return () => clearTimeout(id);
  }, [text, value, onCommit]);

  // If the URL is cleared elsewhere (e.g. "Clear filters"), reflect that in the box.
  useEffect(() => {
    if (value === committed.current) return;
    committed.current = value;
    setText(value);
  }, [value]);

  return (
    <div className="relative flex-1">
      <label htmlFor="search" className="sr-only">
        Search restaurants, cuisines, or neighborhoods
      </label>
      <Icon
        name="search"
        className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink-500"
      />
      <input
        id="search"
        type="search"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Search places or cuisines"
        autoComplete="off"
        className="h-12 w-full rounded-full border-2 border-ink-700 bg-cream-50 pl-12 pr-4 text-base placeholder:text-ink-500 focus:border-sage-600"
      />
    </div>
  );
}

function ListSkeleton() {
  return (
    <div role="status" className="grid gap-4 md:grid-cols-2">
      <span className="sr-only">Loading restaurants…</span>
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="overflow-hidden rounded-card bg-cream-50 shadow-card">
          <Skeleton className="h-32 rounded-none" />
          <div className="flex flex-col gap-3 p-4">
            <Skeleton className="h-6 w-2/3" />
            <Skeleton className="h-4 w-1/2" />
            <div className="flex gap-2">
              <Skeleton className="h-7 w-24" />
              <Skeleton className="h-7 w-24" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function DiscoverPage() {
  const { filters, update, clearAll, activeCount } = useFilterParams();
  const [sheetOpen, setSheetOpen] = useState(false);
  const now = useNow();
  const { data, isPending, isError, isPlaceholderData, refetch } =
    useRestaurants(filters);

  const anyFilter = hasAnyFilter(filters);
  const noneOpenTonight =
    !!filters.goodForTonight &&
    !!data?.length &&
    !data.some((r) => isGoodForTonight(r, now));

  return (
    <div className="flex flex-col gap-4">
      <header>
        <h1 className="font-title text-3xl font-bold leading-tight">
          Where can we eat tonight?
        </h1>
        <p className="mt-1 text-ink-500">Relaxed spots that welcome the whole family.</p>
      </header>

      <div className="flex items-center gap-2">
        <SearchBox value={filters.query ?? ''} onCommit={(query) => update({ query })} />
        <button
          type="button"
          onClick={() => setSheetOpen(true)}
          className="relative flex size-12 shrink-0 items-center justify-center rounded-full border-2 border-ink-700 bg-cream-50 hover:border-sage-600"
          aria-label={activeCount ? `Filters, ${activeCount} selected` : 'Filters'}
        >
          <Icon name="sliders" />
          {activeCount > 0 && (
            <span
              aria-hidden="true"
              className="absolute -right-1 -top-1 flex size-6 items-center justify-center rounded-full bg-sage-600 text-sm font-bold text-white"
            >
              {activeCount}
            </span>
          )}
        </button>
      </div>

      <button
        type="button"
        role="switch"
        aria-checked={!!filters.goodForTonight}
        onClick={() =>
          update({ goodForTonight: filters.goodForTonight ? undefined : true })
        }
        className={cn(
          'flex min-h-14 items-center justify-between gap-4 rounded-card border-2 px-4 py-3 text-left transition-colors',
          filters.goodForTonight
            ? 'border-sage-600 bg-sage-100'
            : 'border-ink-700 bg-cream-50 hover:border-sage-600',
        )}
      >
        <span>
          <span className="block text-base font-semibold">🌙 Good for tonight</span>
          <span className="block text-sm text-ink-500">
            Open now and walk-ins welcome, first
          </span>
        </span>
        <span
          aria-hidden="true"
          className={cn(
            'flex h-7 w-12 shrink-0 items-center rounded-full p-0.5 transition-colors',
            filters.goodForTonight ? 'bg-sage-600' : 'bg-cream-300',
          )}
        >
          <span
            className={cn(
              'size-6 rounded-full bg-white shadow transition-transform',
              filters.goodForTonight && 'translate-x-5',
            )}
          />
        </span>
      </button>

      <div
        role="group"
        aria-label="Quick filters"
        className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] md:mx-0 md:flex-wrap md:px-0 [&::-webkit-scrollbar]:hidden"
      >
        {QUICK_FILTERS.map((def) => (
          <Chip
            strongOutline
            key={def.key}
            selected={!!filters.attributes?.[def.key]?.includes(true)}
            onClick={() => {
              const next = { ...filters.attributes };
              const list = toggleInList(next[def.key], true);
              if (list) next[def.key] = list;
              else delete next[def.key];
              update({ attributes: Object.keys(next).length ? next : undefined });
            }}
          >
            <span aria-hidden="true">{def.emoji}</span> {def.shortLabel}
          </Chip>
        ))}
      </div>

      <section
        aria-labelledby="results-heading"
        aria-busy={isPending || isPlaceholderData}
      >
        <div className="mb-3 flex items-center justify-between">
          <h2 id="results-heading" className="text-lg font-semibold">
            {data ? `${data.length} ${data.length === 1 ? 'place' : 'places'}` : 'Places'}
          </h2>
          {anyFilter && (
            <Button variant="ghost" onClick={clearAll} className="-mr-3">
              Clear filters
            </Button>
          )}
        </div>

        {noneOpenTonight && (
          <p
            role="status"
            className="mb-3 rounded-card bg-apricot-100 px-4 py-3 text-apricot-700"
          >
            Nothing here is open with walk-ins right now, so you&apos;re seeing everything
            that matches.
          </p>
        )}

        {isPending ? (
          <ListSkeleton />
        ) : isError ? (
          <ErrorState
            title="We couldn't load restaurants"
            message="Check your connection and try again."
            onRetry={() => void refetch()}
          />
        ) : data.length === 0 ? (
          <EmptyState
            emoji="🔍"
            title="No places match"
            action={
              anyFilter && (
                <Button variant="secondary" onClick={clearAll}>
                  Clear filters
                </Button>
              )
            }
          >
            Try removing a filter or searching for something else.
          </EmptyState>
        ) : (
          <ul
            className={cn(
              'grid gap-4 transition-opacity md:grid-cols-2',
              isPlaceholderData && 'opacity-60',
            )}
          >
            {data.map((restaurant) => (
              <li key={restaurant.id}>
                <RestaurantCard restaurant={restaurant} now={now} />
              </li>
            ))}
          </ul>
        )}
      </section>

      <FilterSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        filters={filters}
        update={update}
        clearAll={clearAll}
        resultCount={data?.length}
      />
    </div>
  );
}
