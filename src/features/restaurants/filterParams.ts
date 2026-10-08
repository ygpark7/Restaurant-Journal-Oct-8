import {
  ATTRIBUTE_DEFS,
  type AttributeKey,
  type AttributeValue,
} from '@/domain/attributes.config';
import type { PriceTier, RestaurantFilters } from '@/domain/types';

/**
 * Filters live in the URL (?q=pizza&price=1&a_highChairs=true&tonight=1) so the back button
 * and shared links work. Attribute params are generated from the attribute config, so a new
 * attribute needs no changes here.
 */
const attrParam = (key: string) => `a_${key}`;

const isFilterParam = (name: string) =>
  name === 'q' ||
  name === 'tonight' ||
  name === 'cuisine' ||
  name === 'price' ||
  name.startsWith('a_');

export function parseFilters(params: URLSearchParams): RestaurantFilters {
  const filters: RestaurantFilters = {};

  const q = params.get('q')?.trim();
  if (q) filters.query = q;
  if (params.get('tonight') === '1') filters.goodForTonight = true;

  const cuisines = params.getAll('cuisine');
  if (cuisines.length) filters.cuisines = cuisines;

  const prices = params
    .getAll('price')
    .map(Number)
    .filter((n): n is PriceTier => [1, 2, 3, 4].includes(n));
  if (prices.length) filters.priceTiers = prices;

  const attributes: Partial<Record<AttributeKey, AttributeValue[]>> = {};
  for (const def of ATTRIBUTE_DEFS) {
    const raw = params.getAll(attrParam(def.key));
    if (def.kind === 'boolean') {
      if (raw.includes('true')) attributes[def.key] = [true];
    } else {
      const valid: AttributeValue[] = def.options
        .map((o) => o.value as string)
        .filter((v) => raw.includes(v));
      if (valid.length) attributes[def.key] = valid;
    }
  }
  if (Object.keys(attributes).length) filters.attributes = attributes;

  return filters;
}

/** Returns `base` with all filter params replaced by those for `filters` (other params kept). */
export function writeFilters(
  base: URLSearchParams,
  filters: RestaurantFilters,
): URLSearchParams {
  const next = new URLSearchParams();
  for (const [name, value] of base) {
    if (!isFilterParam(name)) next.append(name, value);
  }
  if (filters.query?.trim()) next.set('q', filters.query.trim());
  if (filters.goodForTonight) next.set('tonight', '1');
  for (const c of filters.cuisines ?? []) next.append('cuisine', c);
  for (const p of filters.priceTiers ?? []) next.append('price', String(p));
  for (const [key, values] of Object.entries(filters.attributes ?? {})) {
    for (const v of values ?? []) next.append(attrParam(key), String(v));
  }
  return next;
}

/** How many filter values are selected (search text and "tonight" are shown separately). */
export function countActiveFilters(filters: RestaurantFilters): number {
  const attrs = Object.values(filters.attributes ?? {}).reduce(
    (sum, values) => sum + (values?.length ?? 0),
    0,
  );
  return attrs + (filters.cuisines?.length ?? 0) + (filters.priceTiers?.length ?? 0);
}

export function hasAnyFilter(filters: RestaurantFilters): boolean {
  return countActiveFilters(filters) > 0 || !!filters.query || !!filters.goodForTonight;
}

/** Toggle one value in a list, returning undefined when the list becomes empty. */
export function toggleInList<T>(list: T[] | undefined, value: T): T[] | undefined {
  const current = list ?? [];
  const next = current.includes(value)
    ? current.filter((v) => v !== value)
    : [...current, value];
  return next.length ? next : undefined;
}
