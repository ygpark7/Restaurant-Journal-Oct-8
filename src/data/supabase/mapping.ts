/** Database rows (snake_case) -> domain types. Pure functions, unit tested. */
import {
  ATTRIBUTE_KEYS,
  type AttributeKey,
  type AttributeValue,
} from '@/domain/attributes.config';
import type {
  ConfirmedAttributes,
  OpeningPeriod,
  PriceTier,
  Rating,
  Restaurant,
  RestaurantAttributes,
  SavedPlace,
  Visit,
  VisitWithAuthor,
  SavedStatus,
} from '@/domain/types';

export interface RestaurantRow {
  id: string;
  name: string;
  cuisine: string;
  neighborhood: string;
  address: string;
  price_tier: number;
  photo_url: string | null;
  description: string | null;
  hours: OpeningPeriod[];
  created_at: string;
}

export interface AttributeRow {
  restaurant_id: string;
  key: string;
  value: AttributeValue;
  last_confirmed_at: string | null;
}

export interface VisitRow {
  id: string;
  restaurant_id: string;
  user_id: string;
  visited_at: string;
  food_rating: number;
  stress_level: number;
  note: string | null;
  photo_url: string | null;
  created_at: string;
  visit_attribute_confirmations: { key: string; value: AttributeValue }[];
  author: { id: string; display_name: string; avatar_emoji: string | null } | null;
}

export interface SavedPlaceRow {
  user_id: string;
  restaurant_id: string;
  status: SavedStatus;
  created_at: string;
}

/** Postgres returns "2026-09-21T12:00:00+00:00"; the app uses "…Z" strings everywhere. */
export function toIso(timestamp: string): string {
  return new Date(timestamp).toISOString();
}

const KNOWN_KEYS = new Set<string>(ATTRIBUTE_KEYS);
/** Ignore attributes that were removed from attributes.config.ts but still exist in the database. */
const isKnownKey = (key: string): key is AttributeKey => KNOWN_KEYS.has(key);

export function toRestaurant(
  row: RestaurantRow,
  attributeRows: AttributeRow[],
): Restaurant {
  const attributes: RestaurantAttributes = {};
  for (const a of attributeRows) {
    if (a.restaurant_id !== row.id || !isKnownKey(a.key)) continue;
    attributes[a.key] = {
      value: a.value,
      lastConfirmedAt: a.last_confirmed_at ? toIso(a.last_confirmed_at) : null,
    };
  }
  return {
    id: row.id,
    name: row.name,
    cuisine: row.cuisine,
    neighborhood: row.neighborhood,
    address: row.address,
    priceTier: row.price_tier as PriceTier,
    photoUrl: row.photo_url,
    description: row.description ?? undefined,
    hours: row.hours,
    attributes,
    createdAt: toIso(row.created_at),
  };
}

export function toVisit(row: VisitRow): Visit {
  const confirmedAttributes: ConfirmedAttributes = {};
  for (const c of row.visit_attribute_confirmations ?? []) {
    if (isKnownKey(c.key)) confirmedAttributes[c.key] = c.value;
  }
  return {
    id: row.id,
    restaurantId: row.restaurant_id,
    userId: row.user_id,
    visitedAt: toIso(row.visited_at),
    foodRating: row.food_rating as Rating,
    stressLevel: row.stress_level as Rating,
    confirmedAttributes,
    note: row.note ?? undefined,
    photoUrl: row.photo_url,
    createdAt: toIso(row.created_at),
  };
}

/** The current user's own visits show as "You", like in the mock. */
export function toVisitWithAuthor(
  row: VisitRow,
  currentUserId: string | null,
): VisitWithAuthor {
  const mine = currentUserId !== null && row.user_id === currentUserId;
  return {
    ...toVisit(row),
    author: mine
      ? {
          id: row.user_id,
          displayName: 'You',
          avatarEmoji: row.author?.avatar_emoji ?? undefined,
        }
      : {
          id: row.user_id,
          displayName: row.author?.display_name ?? 'A parent',
          avatarEmoji: row.author?.avatar_emoji ?? undefined,
        },
  };
}

export function toSavedPlace(row: SavedPlaceRow): SavedPlace {
  return {
    userId: row.user_id,
    restaurantId: row.restaurant_id,
    status: row.status,
    createdAt: toIso(row.created_at),
  };
}
