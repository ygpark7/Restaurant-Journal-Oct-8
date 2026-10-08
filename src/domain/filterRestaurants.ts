import { WALK_IN_KEY } from './attributes.config';
import type { OpeningPeriod, Restaurant, RestaurantFilters } from './types';

const NYC = 'America/New_York';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/** The day of week (0 = Sunday) and minutes since midnight at `date` in New York. */
export function nycClock(date: Date): { day: number; minutes: number } {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: NYC,
    weekday: 'short',
    hour: 'numeric',
    minute: 'numeric',
    hourCycle: 'h23',
  }).formatToParts(date);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? '';
  return {
    day: WEEKDAYS.indexOf(get('weekday')),
    minutes: Number(get('hour')) * 60 + Number(get('minute')),
  };
}

function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(':');
  return Number(h) * 60 + Number(m);
}

export function isOpenAt(hours: OpeningPeriod[], date: Date): boolean {
  const { day, minutes } = nycClock(date);
  const yesterday = (day + 6) % 7;
  return hours.some((p) => {
    const open = toMinutes(p.open);
    const close = toMinutes(p.close);
    const crossesMidnight = close <= open;
    if (p.day === day) {
      return crossesMidnight ? minutes >= open : minutes >= open && minutes < close;
    }
    // A window that started yesterday and runs past midnight.
    return crossesMidnight && p.day === yesterday && minutes < close;
  });
}

/** Open right now and takes walk-ins (an unknown walk-in policy doesn't count). */
export function isGoodForTonight(restaurant: Restaurant, now: Date): boolean {
  return (
    restaurant.attributes[WALK_IN_KEY]?.value === true && isOpenAt(restaurant.hours, now)
  );
}

export function matchesFilters(
  restaurant: Restaurant,
  filters: RestaurantFilters,
): boolean {
  const query = filters.query?.trim().toLowerCase();
  if (query) {
    const haystack =
      `${restaurant.name} ${restaurant.cuisine} ${restaurant.neighborhood}`.toLowerCase();
    if (!query.split(/\s+/).every((word) => haystack.includes(word))) return false;
  }
  if (filters.cuisines?.length && !filters.cuisines.includes(restaurant.cuisine)) {
    return false;
  }
  if (filters.priceTiers?.length && !filters.priceTiers.includes(restaurant.priceTier)) {
    return false;
  }
  for (const [key, accepted] of Object.entries(filters.attributes ?? {})) {
    if (!accepted?.length) continue;
    const state = restaurant.attributes[key as keyof typeof restaurant.attributes];
    if (!state || !accepted.includes(state.value)) return false;
  }
  return true;
}

/**
 * Pure filter + rank. "Good for tonight" doesn't hide anything: it moves matching places
 * to the top. Ties are broken alphabetically so the order is stable.
 */
export function filterRestaurants(
  restaurants: Restaurant[],
  filters: RestaurantFilters = {},
): Restaurant[] {
  const now = filters.now ?? new Date();
  const matches = restaurants.filter((r) => matchesFilters(r, filters));
  return matches.sort((a, b) => {
    if (filters.goodForTonight) {
      const diff = Number(isGoodForTonight(b, now)) - Number(isGoodForTonight(a, now));
      if (diff !== 0) return diff;
    }
    return a.name.localeCompare(b.name);
  });
}
