/**
 * ⚠️ FAKE DATA ⚠️
 * Every restaurant, address, attribute, and note in this folder is invented for
 * development. Names are fictional; any resemblance to real businesses is coincidental.
 */
import type { AttributeKey, AttributeValue } from '@/domain/attributes.config';
import type {
  OpeningPeriod,
  PriceTier,
  Restaurant,
  RestaurantAttributes,
} from '@/domain/types';

export const IS_SAMPLE_DATA = true;

type Day = OpeningPeriod['day'];
const ALL_DAYS: Day[] = [0, 1, 2, 3, 4, 5, 6];
const WEEKDAYS: Day[] = [1, 2, 3, 4, 5];
const WEEKEND: Day[] = [0, 6];
const NO_MONDAY: Day[] = [0, 2, 3, 4, 5, 6];

function hrs(open: string, close: string, days: Day[] = ALL_DAYS): OpeningPeriod[] {
  return days.map((day) => ({ day, open, close }));
}

/** A value, or [value, confirmedDate] to override the restaurant's default date. */
type Seed = AttributeValue | [AttributeValue, string];

function attrs(
  confirmedOn: string,
  values: Partial<Record<AttributeKey, Seed>>,
): RestaurantAttributes {
  const result: RestaurantAttributes = {};
  for (const [key, seed] of Object.entries(values)) {
    const [value, date] = Array.isArray(seed) ? seed : [seed, confirmedOn];
    result[key as AttributeKey] = {
      value,
      lastConfirmedAt: new Date(`${date}T12:00:00Z`).toISOString(),
    };
  }
  return result;
}

interface RestaurantSeed {
  id: string;
  name: string;
  cuisine: string;
  neighborhood: string;
  address: string;
  priceTier: PriceTier;
  description: string;
  hours: OpeningPeriod[];
  attributes: RestaurantAttributes;
}

const SEEDS: RestaurantSeed[] = [
  // ───────── Carroll Gardens ─────────
  {
    id: 'r-olive-ember',
    name: 'Olive & Ember',
    cuisine: 'Mediterranean',
    neighborhood: 'Carroll Gardens',
    address: '318 Court St, Brooklyn, NY 11231',
    priceTier: 2,
    description: 'Wood-fired flatbreads, mezze to share, and a sunny back garden.',
    hours: hrs('11:30', '22:00'),
    attributes: attrs('2026-09-21', {
      kidsMenu: true,
      highChairs: true,
      strollerFriendly: [true, '2026-10-02'],
      noiseLevel: 'moderate',
      changingTable: false,
      takesReservations: true,
      walkInsWelcome: true,
    }),
  },
  {
    id: 'r-little-sprout',
    name: 'Little Sprout Pizzeria',
    cuisine: 'Pizza',
    neighborhood: 'Carroll Gardens',
    address: '142 Smith St, Brooklyn, NY 11231',
    priceTier: 1,
    description: 'Slices and whole pies, a crayon cup on every table, fast service.',
    hours: hrs('11:00', '23:00'),
    attributes: attrs('2026-10-02', {
      kidsMenu: true,
      highChairs: true,
      strollerFriendly: true,
      noiseLevel: 'lively',
      changingTable: true,
      takesReservations: false,
      walkInsWelcome: true,
    }),
  },
  {
    id: 'r-court-dumpling',
    name: 'Court Street Dumpling House',
    cuisine: 'Chinese',
    neighborhood: 'Carroll Gardens',
    address: '257 Court St, Brooklyn, NY 11231',
    priceTier: 1,
    description: 'Steamed and pan-fried dumplings, big round tables, quick turnaround.',
    hours: hrs('11:30', '21:30'),
    attributes: attrs('2026-08-30', {
      kidsMenu: false,
      highChairs: true,
      strollerFriendly: false,
      noiseLevel: 'lively',
      takesReservations: false,
      walkInsWelcome: true,
    }),
  },
  {
    id: 'r-marigold',
    name: 'Marigold Taqueria',
    cuisine: 'Mexican',
    neighborhood: 'Carroll Gardens',
    address: '90 Union St, Brooklyn, NY 11231',
    priceTier: 2,
    description: 'Build-your-own tacos, mild salsas on request, and a patio.',
    hours: [...hrs('12:00', '22:00', NO_MONDAY)],
    attributes: attrs('2026-09-14', {
      kidsMenu: true,
      highChairs: false,
      strollerFriendly: true,
      noiseLevel: 'lively',
      changingTable: false,
      takesReservations: false,
      walkInsWelcome: true,
    }),
  },
  {
    id: 'r-kettle-crumb',
    name: 'Kettle & Crumb',
    cuisine: 'American',
    neighborhood: 'Carroll Gardens',
    address: '211 Henry St, Brooklyn, NY 11231',
    priceTier: 2,
    description: 'All-day brunch, pancake flights, and a quiet corner for nursing.',
    hours: [...hrs('08:00', '15:00', WEEKDAYS), ...hrs('08:00', '16:00', WEEKEND)],
    attributes: attrs('2026-09-28', {
      kidsMenu: true,
      highChairs: true,
      strollerFriendly: true,
      noiseLevel: 'moderate',
      changingTable: true,
      takesReservations: false,
      walkInsWelcome: [false, '2026-09-28'],
    }),
  },

  // ───────── Park Slope ─────────
  {
    id: 'r-fifth-flour',
    name: 'Fifth & Flour Bakehouse',
    cuisine: 'Bakery & Café',
    neighborhood: 'Park Slope',
    address: '404 Fifth Ave, Brooklyn, NY 11215',
    priceTier: 1,
    description: 'Pastries, soups, and grilled cheese. Wide aisles for strollers.',
    hours: hrs('07:00', '18:00'),
    attributes: attrs('2026-09-30', {
      kidsMenu: true,
      highChairs: true,
      strollerFriendly: true,
      noiseLevel: 'moderate',
      changingTable: true,
      takesReservations: false,
      walkInsWelcome: true,
    }),
  },
  {
    id: 'r-seventh-noodle',
    name: 'Seventh Ave Noodle Bar',
    cuisine: 'Japanese',
    neighborhood: 'Park Slope',
    address: '175 Seventh Ave, Brooklyn, NY 11215',
    priceTier: 2,
    description: 'Ramen and udon with small-bowl portions for little eaters.',
    hours: hrs('11:30', '22:00'),
    attributes: attrs('2026-09-05', {
      kidsMenu: true,
      highChairs: true,
      strollerFriendly: false,
      noiseLevel: 'moderate',
      takesReservations: false,
      walkInsWelcome: true,
    }),
  },
  {
    id: 'r-brownstone-burger',
    name: 'Brownstone Burger Co.',
    cuisine: 'American',
    neighborhood: 'Park Slope',
    address: '88 Fifth Ave, Brooklyn, NY 11215',
    priceTier: 2,
    description: 'Burgers, shakes, and a kids menu that arrives in two minutes flat.',
    hours: hrs('11:30', '23:00'),
    attributes: attrs('2026-10-04', {
      kidsMenu: true,
      highChairs: true,
      strollerFriendly: true,
      noiseLevel: 'lively',
      changingTable: true,
      takesReservations: false,
      walkInsWelcome: true,
    }),
  },
  {
    id: 'r-saffron-table',
    name: 'Saffron Table',
    cuisine: 'Indian',
    neighborhood: 'Park Slope',
    address: '312 Seventh Ave, Brooklyn, NY 11215',
    priceTier: 2,
    description: 'Mild curries, naan for tearing, and a patient, friendly staff.',
    hours: hrs('17:00', '22:30'),
    attributes: attrs('2026-08-12', {
      kidsMenu: false,
      highChairs: true,
      strollerFriendly: true,
      noiseLevel: 'quiet',
      changingTable: false,
      takesReservations: true,
      walkInsWelcome: true,
    }),
  },
  {
    id: 'r-lantern-room',
    name: 'The Lantern Room',
    cuisine: 'American',
    neighborhood: 'Park Slope',
    address: '29 Fifth Ave, Brooklyn, NY 11215',
    priceTier: 3,
    description: 'Date-night menu by night, surprisingly relaxed early-bird dinner.',
    hours: hrs('17:00', '23:00', NO_MONDAY),
    attributes: attrs('2026-07-19', {
      kidsMenu: false,
      highChairs: false,
      strollerFriendly: false,
      noiseLevel: 'quiet',
      changingTable: false,
      takesReservations: true,
      walkInsWelcome: false,
    }),
  },
  {
    id: 'r-prospect-pie',
    name: 'Prospect Pie Shop',
    cuisine: 'Pizza',
    neighborhood: 'Park Slope',
    address: '551 Flatbush Ave, Brooklyn, NY 11215',
    priceTier: 1,
    description: 'Thin-crust pies and a big communal table near the park.',
    hours: hrs('11:00', '22:00'),
    attributes: attrs('2026-09-09', {
      kidsMenu: true,
      highChairs: true,
      strollerFriendly: true,
      noiseLevel: 'lively',
      takesReservations: false,
      walkInsWelcome: true,
    }),
  },

  // ───────── Cobble Hill ─────────
  {
    id: 'r-atlantic-mezze',
    name: 'Atlantic Avenue Mezze',
    cuisine: 'Middle Eastern',
    neighborhood: 'Cobble Hill',
    address: '233 Atlantic Ave, Brooklyn, NY 11201',
    priceTier: 2,
    description: 'Share-everything plates: hummus, warm pita, grilled chicken skewers.',
    hours: hrs('12:00', '22:00'),
    attributes: attrs('2026-09-18', {
      kidsMenu: false,
      highChairs: true,
      strollerFriendly: true,
      noiseLevel: 'moderate',
      changingTable: false,
      takesReservations: true,
      walkInsWelcome: true,
    }),
  },
  {
    id: 'r-maison-petit',
    name: 'Maison Petit',
    cuisine: 'French',
    neighborhood: 'Cobble Hill',
    address: '67 Court St, Brooklyn, NY 11201',
    priceTier: 3,
    description: 'Classic bistro. Calm weekday lunches, a proper croque monsieur.',
    hours: [...hrs('11:30', '15:00', WEEKDAYS), ...hrs('11:30', '22:00', [5, 6, 0])],
    attributes: attrs('2026-06-22', {
      kidsMenu: true,
      highChairs: true,
      strollerFriendly: false,
      noiseLevel: 'quiet',
      changingTable: false,
      takesReservations: true,
      walkInsWelcome: false,
    }),
  },
  {
    id: 'r-hoyt-bagels',
    name: 'Hoyt Street Deli & Bagels',
    cuisine: 'Deli',
    neighborhood: 'Cobble Hill',
    address: '120 Hoyt St, Brooklyn, NY 11201',
    priceTier: 1,
    description: 'Bagels, egg sandwiches, and a bench out front. Mostly grab-and-go.',
    hours: hrs('06:30', '16:00'),
    attributes: attrs('2026-08-02', {
      kidsMenu: false,
      highChairs: false,
      strollerFriendly: false,
      noiseLevel: 'moderate',
      takesReservations: false,
      walkInsWelcome: true,
    }),
  },
  {
    id: 'r-cobble-cantina',
    name: 'Cobble Hill Cantina',
    cuisine: 'Mexican',
    neighborhood: 'Cobble Hill',
    address: '194 Court St, Brooklyn, NY 11201',
    priceTier: 2,
    description: 'Chips arrive instantly. Big booths, even bigger quesadillas.',
    hours: hrs('11:30', '23:00'),
    attributes: attrs('2026-10-01', {
      kidsMenu: true,
      highChairs: true,
      strollerFriendly: true,
      noiseLevel: 'lively',
      changingTable: true,
      takesReservations: true,
      walkInsWelcome: true,
    }),
  },
  {
    id: 'r-basil-brine',
    name: 'Basil & Brine',
    cuisine: 'Italian',
    neighborhood: 'Cobble Hill',
    address: '41 Clinton St, Brooklyn, NY 11201',
    priceTier: 3,
    description: 'Handmade pasta, a half-portion option for kids, and a cozy room.',
    hours: hrs('17:00', '22:30', NO_MONDAY),
    attributes: attrs('2026-09-12', {
      kidsMenu: true,
      highChairs: true,
      strollerFriendly: false,
      noiseLevel: 'moderate',
      changingTable: false,
      takesReservations: true,
      walkInsWelcome: [false, '2026-09-12'],
    }),
  },

  // ───────── Upper West Side ─────────
  {
    id: 'r-amsterdam-diner',
    name: 'Amsterdam Diner',
    cuisine: 'Diner',
    neighborhood: 'Upper West Side',
    address: '712 Amsterdam Ave, New York, NY 10025',
    priceTier: 1,
    description: 'Open late, huge menu, pancakes at any hour. Booths fit strollers.',
    hours: hrs('07:00', '01:00'),
    attributes: attrs('2026-10-05', {
      kidsMenu: true,
      highChairs: true,
      strollerFriendly: true,
      noiseLevel: 'moderate',
      changingTable: true,
      takesReservations: false,
      walkInsWelcome: true,
    }),
  },
  {
    id: 'r-columbus-thai',
    name: 'Columbus Corner Thai',
    cuisine: 'Thai',
    neighborhood: 'Upper West Side',
    address: '455 Columbus Ave, New York, NY 10024',
    priceTier: 2,
    description: 'Pad thai and mild coconut soups; spice level is always adjustable.',
    hours: hrs('11:30', '22:30'),
    attributes: attrs('2026-09-02', {
      kidsMenu: false,
      highChairs: true,
      strollerFriendly: true,
      noiseLevel: 'quiet',
      takesReservations: true,
      walkInsWelcome: true,
    }),
  },
  {
    id: 'r-riverside-sushi',
    name: 'Riverside Sushi House',
    cuisine: 'Japanese',
    neighborhood: 'Upper West Side',
    address: '2480 Broadway, New York, NY 10025',
    priceTier: 2,
    description: 'Cucumber rolls, teriyaki bowls, and a bright, uncrowded room.',
    hours: hrs('12:00', '22:00'),
    attributes: attrs('2026-08-21', {
      kidsMenu: true,
      highChairs: false,
      strollerFriendly: true,
      noiseLevel: 'quiet',
      changingTable: false,
      takesReservations: true,
      walkInsWelcome: true,
    }),
  },
  {
    id: 'r-broadway-bistro',
    name: 'The Broadway Bistro',
    cuisine: 'American',
    neighborhood: 'Upper West Side',
    address: '2214 Broadway, New York, NY 10024',
    priceTier: 3,
    description:
      'Polished neighborhood spot with a thoughtful kids menu and weekend brunch.',
    hours: hrs('10:00', '23:00'),
    attributes: attrs('2026-09-26', {
      kidsMenu: true,
      highChairs: true,
      strollerFriendly: true,
      noiseLevel: 'moderate',
      changingTable: true,
      takesReservations: true,
      walkInsWelcome: false,
    }),
  },
  {
    id: 'r-bella-nonna',
    name: 'Bella Nonna Trattoria',
    cuisine: 'Italian',
    neighborhood: 'Upper West Side',
    address: '338 Columbus Ave, New York, NY 10023',
    priceTier: 2,
    description: 'Red-sauce favorites, free bread, and servers who love little ones.',
    hours: hrs('11:30', '22:30'),
    attributes: attrs('2026-10-03', {
      kidsMenu: true,
      highChairs: true,
      strollerFriendly: true,
      noiseLevel: 'lively',
      changingTable: false,
      takesReservations: true,
      walkInsWelcome: true,
    }),
  },
  {
    id: 'r-west-end-falafel',
    name: 'West End Falafel',
    cuisine: 'Middle Eastern',
    neighborhood: 'Upper West Side',
    address: '902 Amsterdam Ave, New York, NY 10025',
    priceTier: 1,
    description:
      'Counter service falafel, fries, and rice bowls. Cheap, fast, forgiving.',
    hours: hrs('11:00', '21:00'),
    attributes: attrs('2026-07-30', {
      kidsMenu: false,
      highChairs: false,
      strollerFriendly: false,
      noiseLevel: 'moderate',
      takesReservations: false,
      walkInsWelcome: true,
    }),
  },

  // ───────── Tribeca ─────────
  {
    id: 'r-hudson-brasserie',
    name: 'Hudson Street Brasserie',
    cuisine: 'French',
    neighborhood: 'Tribeca',
    address: '176 Hudson St, New York, NY 10013',
    priceTier: 3,
    description: 'High ceilings, white tablecloths, and a weekend family brunch.',
    hours: [...hrs('17:30', '23:00', WEEKDAYS), ...hrs('10:00', '23:00', WEEKEND)],
    attributes: attrs('2026-06-04', {
      kidsMenu: true,
      highChairs: true,
      strollerFriendly: true,
      noiseLevel: 'moderate',
      changingTable: true,
      takesReservations: true,
      walkInsWelcome: false,
    }),
  },
  {
    id: 'r-duane-dough',
    name: 'Duane Dough',
    cuisine: 'Pizza',
    neighborhood: 'Tribeca',
    address: '63 Duane St, New York, NY 10013',
    priceTier: 2,
    description: 'Wood-oven pizza with an open kitchen the kids can watch.',
    hours: hrs('11:30', '22:30'),
    attributes: attrs('2026-09-24', {
      kidsMenu: true,
      highChairs: true,
      strollerFriendly: true,
      noiseLevel: 'lively',
      changingTable: true,
      takesReservations: true,
      walkInsWelcome: true,
    }),
  },
  {
    id: 'r-franklin-fields',
    name: 'Franklin Fields Kitchen',
    cuisine: 'Farm-to-table',
    neighborhood: 'Tribeca',
    address: '30 Franklin St, New York, NY 10013',
    priceTier: 3,
    description:
      'Seasonal plates, roomy tables, and an early dinner seating for families.',
    hours: hrs('11:00', '21:30', NO_MONDAY),
    attributes: attrs('2026-08-27', {
      kidsMenu: true,
      highChairs: true,
      strollerFriendly: true,
      noiseLevel: 'quiet',
      changingTable: true,
      takesReservations: true,
      walkInsWelcome: true,
    }),
  },
];

export const SEED_RESTAURANTS: Restaurant[] = SEEDS.map((seed) => ({
  ...seed,
  photoUrl: null,
  createdAt: '2026-01-15T12:00:00.000Z',
}));
