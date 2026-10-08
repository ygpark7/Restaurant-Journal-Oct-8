/**
 * Domain types, shaped to map onto future database tables.
 *
 *   Restaurant            -> restaurants
 *   RestaurantAttributes  -> restaurant_attributes (restaurant_id, key, value jsonb, last_confirmed_at)
 *   Visit                 -> visits (+ visit_attribute_confirmations)
 *   SavedPlace            -> saved_places (user_id, restaurant_id, status)
 *   User                  -> profiles
 */
import type { AttributeKey, AttributeValue } from './attributes.config';

export type { AttributeKey, AttributeValue };

/** A uuid once we move to Supabase. */
export type Id = string;
/** ISO 8601 timestamp. */
export type IsoDate = string;

export type PriceTier = 1 | 2 | 3 | 4;
export type Rating = 1 | 2 | 3 | 4 | 5;

export interface User {
  id: Id;
  displayName: string;
  avatarEmoji?: string;
}

/** The signed-in person, as the auth system knows them (the email is private). */
export interface AuthUser {
  id: Id;
  email: string;
  /** Shown publicly next to their notes. Undefined means "A parent". */
  displayName?: string;
}

/** One opening window. `close` earlier than `open` means it runs past midnight. */
export interface OpeningPeriod {
  /** 0 = Sunday ... 6 = Saturday, in New York local time. */
  day: 0 | 1 | 2 | 3 | 4 | 5 | 6;
  /** "HH:mm", 24-hour. */
  open: string;
  close: string;
}

export interface AttributeState {
  value: AttributeValue;
  /** When a parent last confirmed this; null if never confirmed. */
  lastConfirmedAt: IsoDate | null;
}

/** An attribute missing from the record means "unknown / not yet confirmed". */
export type RestaurantAttributes = Partial<Record<AttributeKey, AttributeState>>;

export interface Restaurant {
  id: Id;
  name: string;
  cuisine: string;
  neighborhood: string;
  address: string;
  priceTier: PriceTier;
  /** null -> UI renders a generated placeholder. */
  photoUrl: string | null;
  description?: string;
  hours: OpeningPeriod[];
  /** Effective values: stored attributes overlaid with the latest parent confirmations. */
  attributes: RestaurantAttributes;
  createdAt: IsoDate;
}

export type ConfirmedAttributes = Partial<Record<AttributeKey, AttributeValue>>;

/** A logged visit. Notes from other parents are just visits that have a `note`. */
export interface Visit {
  id: Id;
  restaurantId: Id;
  userId: Id;
  visitedAt: IsoDate;
  foodRating: Rating;
  /** 1 = relaxed ... 5 = chaos. */
  stressLevel: Rating;
  confirmedAttributes: ConfirmedAttributes;
  note?: string;
  photoUrl?: string | null;
  createdAt: IsoDate;
}

/** What the UI sends; the repository fills in id, userId, and createdAt. */
export type NewVisit = Omit<Visit, 'id' | 'userId' | 'createdAt'>;

export type VisitWithAuthor = Visit & { author: User };

export type SavedStatus = 'want_to_try' | 'been_there';

export interface SavedPlace {
  userId: Id;
  restaurantId: Id;
  status: SavedStatus;
  createdAt: IsoDate;
}

export type SavedPlaceWithRestaurant = SavedPlace & { restaurant: Restaurant };

export interface RestaurantFilters {
  /** Free text; matches name, cuisine, and neighborhood. */
  query?: string;
  cuisines?: string[];
  priceTiers?: PriceTier[];
  /** Per attribute, the accepted values (OR within an attribute, AND across attributes). */
  attributes?: Partial<Record<AttributeKey, AttributeValue[]>>;
  /** Rank places that are open now and take walk-ins first. */
  goodForTonight?: boolean;
  /** Injected clock for testing; defaults to the current time. */
  now?: Date;
}
