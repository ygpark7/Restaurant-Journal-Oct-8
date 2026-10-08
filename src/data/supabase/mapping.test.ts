import { describe, expect, it } from 'vitest';
import {
  toIso,
  toRestaurant,
  toSavedPlace,
  toVisit,
  toVisitWithAuthor,
  type RestaurantRow,
  type VisitRow,
} from './mapping';

const restaurantRow: RestaurantRow = {
  id: 'r-1',
  name: 'Olive & Ember',
  cuisine: 'Mediterranean',
  neighborhood: 'Carroll Gardens',
  address: '1 Fake St',
  price_tier: 2,
  photo_url: null,
  description: null,
  hours: [{ day: 4, open: '11:00', close: '22:00' }],
  created_at: '2026-01-15T12:00:00+00:00',
};

const visitRow: VisitRow = {
  id: 'v-1',
  restaurant_id: 'r-1',
  user_id: 'u-1',
  visited_at: '2026-10-02T18:00:00+00:00',
  food_rating: 4,
  stress_level: 2,
  note: 'Great',
  photo_url: null,
  created_at: '2026-10-02T18:00:00+00:00',
  visit_attribute_confirmations: [
    { key: 'highChairs', value: true },
    { key: 'removedAttribute', value: true },
  ],
  author: { id: 'u-1', display_name: 'Maya, mom of 2', avatar_emoji: '🧑‍🍼' },
};

describe('Supabase row mapping', () => {
  it('normalizes Postgres timestamps to the Z form the app uses', () => {
    expect(toIso('2026-09-21T12:00:00+00:00')).toBe('2026-09-21T12:00:00.000Z');
    expect(toIso('2026-09-21T08:00:00-04:00')).toBe('2026-09-21T12:00:00.000Z');
  });

  it('maps a restaurant and attaches only its own, known attributes', () => {
    const restaurant = toRestaurant(restaurantRow, [
      {
        restaurant_id: 'r-1',
        key: 'noiseLevel',
        value: 'quiet',
        last_confirmed_at: '2026-09-21T12:00:00+00:00',
      },
      { restaurant_id: 'r-1', key: 'highChairs', value: true, last_confirmed_at: null },
      { restaurant_id: 'r-2', key: 'kidsMenu', value: true, last_confirmed_at: null },
      {
        restaurant_id: 'r-1',
        key: 'removedAttribute',
        value: true,
        last_confirmed_at: null,
      },
    ]);

    expect(restaurant).toMatchObject({
      id: 'r-1',
      priceTier: 2,
      description: undefined,
      createdAt: '2026-01-15T12:00:00.000Z',
    });
    expect(restaurant.attributes).toEqual({
      noiseLevel: { value: 'quiet', lastConfirmedAt: '2026-09-21T12:00:00.000Z' },
      highChairs: { value: true, lastConfirmedAt: null },
    });
  });

  it('maps a visit and drops confirmations for attributes no longer in the config', () => {
    expect(toVisit(visitRow)).toMatchObject({
      id: 'v-1',
      restaurantId: 'r-1',
      foodRating: 4,
      stressLevel: 2,
      note: 'Great',
      visitedAt: '2026-10-02T18:00:00.000Z',
      confirmedAttributes: { highChairs: true },
    });
  });

  it("labels the current user's own visits 'You' and others by their profile name", () => {
    expect(toVisitWithAuthor(visitRow, 'u-1').author.displayName).toBe('You');
    expect(toVisitWithAuthor(visitRow, 'someone-else').author.displayName).toBe(
      'Maya, mom of 2',
    );
    expect(toVisitWithAuthor(visitRow, null).author.displayName).toBe('Maya, mom of 2');
    expect(
      toVisitWithAuthor({ ...visitRow, author: null }, null).author.displayName,
    ).toBe('A parent');
  });

  it('maps a saved place', () => {
    expect(
      toSavedPlace({
        user_id: 'u-1',
        restaurant_id: 'r-1',
        status: 'been_there',
        created_at: '2026-10-02T18:00:00+00:00',
      }),
    ).toEqual({
      userId: 'u-1',
      restaurantId: 'r-1',
      status: 'been_there',
      createdAt: '2026-10-02T18:00:00.000Z',
    });
  });
});
