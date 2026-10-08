import type { AttributeKey } from '@/domain/attributes.config';
import type { Restaurant, RestaurantAttributes, Visit } from '@/domain/types';

/**
 * A restaurant's effective attributes = its stored attributes, overlaid per attribute
 * with the most recent visit that confirmed it. This is what a SQL view would do later.
 */
export function withConfirmations(restaurant: Restaurant, visits: Visit[]): Restaurant {
  const attributes: RestaurantAttributes = { ...restaurant.attributes };
  const relevant = visits
    .filter((v) => v.restaurantId === restaurant.id)
    .sort((a, b) => a.visitedAt.localeCompare(b.visitedAt));

  for (const visit of relevant) {
    for (const [key, value] of Object.entries(visit.confirmedAttributes)) {
      if (value === undefined) continue;
      const current = attributes[key as AttributeKey];
      // `>=`: on a tie the visit wins, since it's the newer information.
      if (!current?.lastConfirmedAt || visit.visitedAt >= current.lastConfirmedAt) {
        attributes[key as AttributeKey] = { value, lastConfirmedAt: visit.visitedAt };
      }
    }
  }
  return { ...restaurant, attributes };
}
