import { Link } from 'react-router';
import { Badge } from '@/components/Badge';
import { PlaceholderPhoto } from '@/components/PlaceholderPhoto';
import { isGoodForTonight, isOpenAt } from '@/domain/filterRestaurants';
import { priceSymbol } from '@/domain/taxonomy.config';
import type { Restaurant } from '@/domain/types';
import { getBadges } from './badges';

export function RestaurantCard({
  restaurant,
  now,
}: {
  restaurant: Restaurant;
  now: Date;
}) {
  const open = isOpenAt(restaurant.hours, now);
  const tonight = isGoodForTonight(restaurant, now);
  const badges = getBadges(restaurant);

  return (
    <article className="relative overflow-hidden rounded-card bg-cream-50 shadow-card transition-shadow focus-within:ring-4 focus-within:ring-sage-600/40 hover:shadow-md">
      <PlaceholderPhoto
        id={restaurant.id}
        cuisine={restaurant.cuisine}
        src={restaurant.photoUrl}
        className="h-32 w-full"
      />
      <div className="flex flex-col gap-2 p-4">
        <div className="flex items-start justify-between gap-3">
          <h2 className="text-lg font-semibold leading-snug">
            {/* The whole card is clickable via the stretched link below. */}
            <Link
              to={`/restaurants/${restaurant.id}`}
              className="after:absolute after:inset-0 after:content-[''] focus-visible:outline-none"
            >
              {restaurant.name}
            </Link>
          </h2>
          <span
            className="shrink-0 font-semibold text-ink-700"
            aria-label={`Price ${restaurant.priceTier} of 4`}
          >
            {priceSymbol(restaurant.priceTier)}
          </span>
        </div>
        <p className="text-ink-500">
          {restaurant.neighborhood} · {restaurant.cuisine}
        </p>
        <p className="flex flex-wrap items-center gap-x-2 text-sm font-medium">
          <span className={open ? 'text-sage-700' : 'text-ink-500'}>
            {open ? '● Open now' : '○ Closed now'}
          </span>
          {tonight && <span className="text-apricot-700">· Good for tonight</span>}
        </p>
        {badges.length > 0 && (
          <ul className="mt-1 flex flex-wrap gap-1.5" aria-label="Kid-friendly features">
            {badges.map((b) => (
              <li key={b.key}>
                <Badge>
                  <span aria-hidden="true">{b.emoji}</span> {b.label}
                </Badge>
              </li>
            ))}
          </ul>
        )}
      </div>
    </article>
  );
}
