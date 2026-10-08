import { Link, useSearchParams } from 'react-router';
import { buttonClasses } from '@/components/Button';
import { EmptyState } from '@/components/EmptyState';
import { ErrorState } from '@/components/ErrorState';
import { Icon } from '@/components/Icon';
import { PlaceholderPhoto } from '@/components/PlaceholderPhoto';
import { Skeleton } from '@/components/Skeleton';
import { Tabs, type TabItem } from '@/components/Tabs';
import type { SavedPlaceWithRestaurant, SavedStatus } from '@/domain/types';
import { priceSymbol } from '@/domain/taxonomy.config';
import { ShareButton } from '@/features/share/ShareButton';
import { useRemoveSaved, useSavedPlaces } from './queries';

type TabId = 'want' | 'been';

const TAB_STATUS: Record<TabId, SavedStatus> = {
  want: 'want_to_try',
  been: 'been_there',
};
const TAB_LABEL: Record<TabId, string> = { want: 'Want to try', been: 'Been there' };

function SavedRow({
  place,
  tabLabel,
  onRemove,
  removing,
}: {
  place: SavedPlaceWithRestaurant;
  tabLabel: string;
  onRemove: () => void;
  removing: boolean;
}) {
  const r = place.restaurant;
  return (
    <li className="flex items-center gap-3 rounded-card bg-cream-50 p-3 shadow-card">
      <Link
        to={`/restaurants/${r.id}`}
        className="flex min-w-0 flex-1 items-center gap-3 rounded-xl"
      >
        <PlaceholderPhoto
          id={r.id}
          cuisine={r.cuisine}
          src={r.photoUrl}
          className="size-16 shrink-0 rounded-xl text-3xl"
        />
        <span className="min-w-0">
          <span className="block truncate text-base font-semibold">{r.name}</span>
          <span className="block truncate text-ink-500">
            {r.neighborhood} · {r.cuisine} · {priceSymbol(r.priceTier)}
          </span>
        </span>
      </Link>
      <button
        type="button"
        onClick={onRemove}
        disabled={removing}
        aria-label={`Remove ${r.name} from ${tabLabel}`}
        className="flex size-11 shrink-0 items-center justify-center rounded-full text-ink-500 hover:bg-rose-100 hover:text-rose-600 disabled:opacity-50"
      >
        <Icon name="trash" />
      </button>
    </li>
  );
}

export function MyPlacesPage() {
  const [params, setParams] = useSearchParams();
  const tab: TabId = params.get('tab') === 'been' ? 'been' : 'want';
  const { data, isPending, isError, refetch } = useSavedPlaces();
  const remove = useRemoveSaved();

  const byTab = (id: TabId) => data?.filter((p) => p.status === TAB_STATUS[id]) ?? [];
  const tabs: TabItem<TabId>[] = (['want', 'been'] as const).map((id) => ({
    id,
    label: TAB_LABEL[id],
    count: data ? byTab(id).length : undefined,
  }));
  const items = byTab(tab);

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-3xl font-bold leading-tight">My places</h1>

      <Tabs
        label="Saved lists"
        tabs={tabs}
        value={tab}
        onChange={(id) => setParams({ tab: id }, { replace: true })}
      />

      <div role="tabpanel" aria-labelledby={`tab-${tab}`} className="flex flex-col gap-3">
        {isPending ? (
          <div role="status" className="flex flex-col gap-3">
            <span className="sr-only">Loading your places…</span>
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-[5.5rem] rounded-card" />
            ))}
          </div>
        ) : isError ? (
          <ErrorState
            title="We couldn't load your places"
            onRetry={() => void refetch()}
          />
        ) : items.length === 0 ? (
          tab === 'want' ? (
            <EmptyState
              emoji="🔖"
              title="Nothing saved yet"
              action={
                <Link to="/" className={buttonClasses('primary')}>
                  Find a place to try
                </Link>
              }
            >
              Tap Save on any restaurant and it will show up here.
            </EmptyState>
          ) : (
            <EmptyState
              emoji="📝"
              title="No visits logged yet"
              action={
                <Link to="/log" className={buttonClasses('primary')}>
                  Log a visit
                </Link>
              }
            >
              Places you log will collect here, so you remember what worked.
            </EmptyState>
          )
        ) : (
          <>
            <div className="flex justify-end">
              <ShareButton
                variant="ghost"
                label="Share list"
                title={`My ${TAB_LABEL[tab]} list`}
                text={`Family-friendly places I've saved (${TAB_LABEL[tab].toLowerCase()}).`}
                path={`/places?tab=${tab}`}
              />
            </div>
            <ul className="flex flex-col gap-3">
              {items.map((place) => (
                <SavedRow
                  key={place.restaurantId}
                  place={place}
                  tabLabel={TAB_LABEL[tab]}
                  removing={remove.isPending && remove.variables === place.restaurantId}
                  onRemove={() => remove.mutate(place.restaurantId)}
                />
              ))}
            </ul>
            {remove.isError && (
              <p role="alert" className="text-rose-600">
                Sorry, we couldn&apos;t remove that. Please try again.
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
