import { describe, expect, it } from 'vitest';
import {
  filterRestaurants,
  isGoodForTonight,
  isOpenAt,
  matchesFilters,
} from './filterRestaurants';
import type { OpeningPeriod, Restaurant } from './types';

const everyDay = (open: string, close: string): OpeningPeriod[] =>
  ([0, 1, 2, 3, 4, 5, 6] as const).map((day) => ({ day, open, close }));

function make(overrides: Partial<Restaurant> & { id: string }): Restaurant {
  return {
    name: overrides.id,
    cuisine: 'Italian',
    neighborhood: 'Park Slope',
    address: '1 Fake St',
    priceTier: 2,
    photoUrl: null,
    hours: everyDay('11:00', '22:00'),
    attributes: {},
    createdAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

const yes = { value: true, lastConfirmedAt: null };
const no = { value: false, lastConfirmedAt: null };

// 7pm in New York on Thursday 8 Oct 2026 (EDT = UTC-4) -> 23:00Z.
const thursdayEvening = new Date('2026-10-08T23:00:00Z');

describe('isOpenAt', () => {
  it('uses New York time, not the machine time zone', () => {
    const hours = everyDay('17:00', '21:00');
    expect(isOpenAt(hours, thursdayEvening)).toBe(true);
    // 3pm New York
    expect(isOpenAt(hours, new Date('2026-10-08T19:00:00Z'))).toBe(false);
  });

  it('treats the closing time as exclusive', () => {
    const hours = everyDay('17:00', '21:00');
    expect(isOpenAt(hours, new Date('2026-10-09T01:00:00Z'))).toBe(false); // 9:00pm
    expect(isOpenAt(hours, new Date('2026-10-09T00:59:00Z'))).toBe(true); // 8:59pm
  });

  it('handles places that close after midnight', () => {
    // Open Thursday (4) 18:00 -> 01:00 Friday
    const hours: OpeningPeriod[] = [{ day: 4, open: '18:00', close: '01:00' }];
    expect(isOpenAt(hours, new Date('2026-10-09T03:30:00Z'))).toBe(true); // Thu 11:30pm
    expect(isOpenAt(hours, new Date('2026-10-09T04:30:00Z'))).toBe(true); // Fri 12:30am
    expect(isOpenAt(hours, new Date('2026-10-09T05:30:00Z'))).toBe(false); // Fri 1:30am
  });

  it('is closed on days with no hours', () => {
    const hours: OpeningPeriod[] = [{ day: 1, open: '11:00', close: '22:00' }];
    expect(isOpenAt(hours, thursdayEvening)).toBe(false);
  });
});

describe('filterRestaurants', () => {
  const items = [
    make({
      id: 'Alpha',
      cuisine: 'Pizza',
      priceTier: 1,
      attributes: {
        highChairs: yes,
        noiseLevel: { value: 'lively', lastConfirmedAt: null },
      },
    }),
    make({
      id: 'Bravo',
      cuisine: 'French',
      neighborhood: 'Tribeca',
      priceTier: 3,
      attributes: {
        highChairs: no,
        noiseLevel: { value: 'quiet', lastConfirmedAt: null },
      },
    }),
    make({
      id: 'Charlie',
      cuisine: 'Pizza',
      priceTier: 2,
      attributes: { highChairs: yes },
    }),
  ];

  it('returns everything, alphabetically, with no filters', () => {
    expect(filterRestaurants(items).map((r) => r.id)).toEqual([
      'Alpha',
      'Bravo',
      'Charlie',
    ]);
  });

  it('matches text across name, cuisine, and neighborhood, case-insensitively', () => {
    expect(filterRestaurants(items, { query: 'pizza' }).map((r) => r.id)).toEqual([
      'Alpha',
      'Charlie',
    ]);
    expect(
      filterRestaurants(items, { query: 'TRIBECA french' }).map((r) => r.id),
    ).toEqual(['Bravo']);
  });

  it('filters by cuisine and price tier', () => {
    expect(
      filterRestaurants(items, { cuisines: ['Pizza'], priceTiers: [2] }),
    ).toHaveLength(1);
    expect(filterRestaurants(items, { priceTiers: [1, 3] }).map((r) => r.id)).toEqual([
      'Alpha',
      'Bravo',
    ]);
  });

  it('ORs values within one attribute and ANDs across attributes', () => {
    expect(
      filterRestaurants(items, { attributes: { noiseLevel: ['quiet', 'moderate'] } }).map(
        (r) => r.id,
      ),
    ).toEqual(['Bravo']);
    expect(
      filterRestaurants(items, {
        attributes: { highChairs: [true], noiseLevel: ['lively'] },
      }).map((r) => r.id),
    ).toEqual(['Alpha']);
  });

  it('excludes restaurants whose attribute is unknown when that attribute is required', () => {
    expect(
      filterRestaurants(items, { attributes: { noiseLevel: ['lively'] } }).map(
        (r) => r.id,
      ),
    ).toEqual(['Alpha']);
  });

  it('ignores empty filter lists', () => {
    expect(
      filterRestaurants(items, { cuisines: [], attributes: { highChairs: [] } }),
    ).toHaveLength(3);
  });
});

describe('Good for tonight', () => {
  const open = make({ id: 'Open', attributes: { walkInsWelcome: yes } });
  const reservationsOnly = make({ id: 'Booked', attributes: { walkInsWelcome: no } });
  const unknownPolicy = make({ id: 'Unknown' });
  const closed = make({
    id: 'Closed',
    hours: everyDay('06:00', '14:00'),
    attributes: { walkInsWelcome: yes },
  });

  it('requires open now AND walk-ins', () => {
    expect(isGoodForTonight(open, thursdayEvening)).toBe(true);
    expect(isGoodForTonight(reservationsOnly, thursdayEvening)).toBe(false);
    expect(isGoodForTonight(unknownPolicy, thursdayEvening)).toBe(false);
    expect(isGoodForTonight(closed, thursdayEvening)).toBe(false);
  });

  it('ranks matches first without hiding the rest', () => {
    const ranked = filterRestaurants([closed, reservationsOnly, open, unknownPolicy], {
      goodForTonight: true,
      now: thursdayEvening,
    });
    expect(ranked.map((r) => r.id)).toEqual(['Open', 'Booked', 'Closed', 'Unknown']);
  });

  it('still applies other filters', () => {
    expect(matchesFilters(open, { cuisines: ['French'] })).toBe(false);
  });
});
