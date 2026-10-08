import { Link, useNavigate, useLocation, useParams } from 'react-router';
import { buttonClasses } from '@/components/Button';
import { EmptyState } from '@/components/EmptyState';
import { ErrorState } from '@/components/ErrorState';
import { Icon } from '@/components/Icon';
import { PlaceholderPhoto } from '@/components/PlaceholderPhoto';
import { Skeleton } from '@/components/Skeleton';
import { isOpenAt } from '@/domain/filterRestaurants';
import { priceSymbol } from '@/domain/taxonomy.config';
import { SaveButton } from '@/features/lists/SaveButton';
import { ShareButton } from '@/features/share/ShareButton';
import { useNow } from '@/lib/useNow';
import { KidFriendliness } from './KidFriendliness';
import { ParentNotes } from './ParentNotes';
import { useRestaurant } from './queries';

function BackButton() {
  const navigate = useNavigate();
  const location = useLocation();
  // `key === 'default'` means this is the first page in the session (e.g. a shared link).
  const canGoBack = location.key !== 'default';
  const className =
    '-ml-2 inline-flex min-h-11 items-center gap-1 rounded-full px-2 font-semibold text-sage-700 hover:bg-cream-200';
  return canGoBack ? (
    <button type="button" onClick={() => navigate(-1)} className={className}>
      <Icon name="chevronLeft" /> Back
    </button>
  ) : (
    <Link to="/" className={className}>
      <Icon name="chevronLeft" /> Discover
    </Link>
  );
}

function DetailSkeleton() {
  return (
    <div role="status" className="flex flex-col gap-4">
      <span className="sr-only">Loading restaurant…</span>
      <Skeleton className="h-48 rounded-card" />
      <Skeleton className="h-8 w-2/3" />
      <Skeleton className="h-5 w-1/2" />
      <Skeleton className="h-12 rounded-full" />
      <Skeleton className="h-64 rounded-card" />
    </div>
  );
}

export function RestaurantDetailPage() {
  const { id } = useParams();
  const now = useNow();
  const { data: restaurant, isPending, isError, refetch } = useRestaurant(id);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <BackButton />
      </div>

      {isPending ? (
        <DetailSkeleton />
      ) : isError ? (
        <ErrorState
          title="We couldn't load this restaurant"
          onRetry={() => void refetch()}
        />
      ) : !restaurant ? (
        <EmptyState
          emoji="🧭"
          title="We couldn't find that restaurant"
          action={
            <Link to="/" className={buttonClasses('primary')}>
              Back to Discover
            </Link>
          }
        />
      ) : (
        <>
          <PlaceholderPhoto
            id={restaurant.id}
            cuisine={restaurant.cuisine}
            src={restaurant.photoUrl}
            alt={restaurant.photoUrl ? restaurant.name : ''}
            className="h-48 w-full rounded-card md:h-64"
          />

          <header className="flex flex-col gap-2">
            <div className="flex items-start justify-between gap-2">
              <h1 className="text-3xl font-bold leading-tight">{restaurant.name}</h1>
              <ShareButton
                iconOnly
                variant="ghost"
                label={`Share ${restaurant.name}`}
                title={restaurant.name}
                text={`${restaurant.name} in ${restaurant.neighborhood}: a family-friendly spot.`}
                path={`/restaurants/${restaurant.id}`}
              />
            </div>
            <p className="text-lg text-ink-700">
              {restaurant.cuisine} · {priceSymbol(restaurant.priceTier)} ·{' '}
              {restaurant.neighborhood}
            </p>
            <p className="flex items-center gap-2 text-ink-500">
              <Icon name="pin" size={20} /> {restaurant.address}
            </p>
            <p className="text-sm font-medium">
              {isOpenAt(restaurant.hours, now) ? (
                <span className="text-sage-700">● Open now</span>
              ) : (
                <span className="text-ink-500">○ Closed now</span>
              )}
            </p>
            {restaurant.description && (
              <p className="text-base">{restaurant.description}</p>
            )}
          </header>

          <div className="grid grid-cols-2 gap-3 sm:flex">
            <SaveButton restaurantId={restaurant.id} name={restaurant.name} />
            <Link
              to={`/log?restaurant=${restaurant.id}`}
              className={buttonClasses('secondary')}
            >
              <Icon name="plus" /> Log a visit
            </Link>
          </div>

          <KidFriendliness restaurant={restaurant} now={now} />
          <ParentNotes restaurantId={restaurant.id} />
        </>
      )}
    </div>
  );
}
