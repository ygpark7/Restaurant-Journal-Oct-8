import type { PriceTier } from './types';

/** Cuisines available in filters. `emoji` is also used for placeholder photos. */
export const CUISINES = [
  { label: 'American', emoji: '🍔' },
  { label: 'Bakery & Café', emoji: '🥐' },
  { label: 'Chinese', emoji: '🥟' },
  { label: 'Deli', emoji: '🥯' },
  { label: 'Diner', emoji: '🍳' },
  { label: 'Farm-to-table', emoji: '🥗' },
  { label: 'French', emoji: '🥖' },
  { label: 'Indian', emoji: '🍛' },
  { label: 'Italian', emoji: '🍝' },
  { label: 'Japanese', emoji: '🍜' },
  { label: 'Mediterranean', emoji: '🫒' },
  { label: 'Mexican', emoji: '🌮' },
  { label: 'Middle Eastern', emoji: '🧆' },
  { label: 'Pizza', emoji: '🍕' },
  { label: 'Thai', emoji: '🍲' },
] as const;

export type Cuisine = (typeof CUISINES)[number]['label'];

export function cuisineEmoji(cuisine: string): string {
  return CUISINES.find((c) => c.label === cuisine)?.emoji ?? '🍽️';
}

export const NEIGHBORHOODS = [
  'Carroll Gardens',
  'Park Slope',
  'Cobble Hill',
  'Upper West Side',
  'Tribeca',
] as const;

export const PRICE_TIERS: readonly { tier: PriceTier; symbol: string; hint: string }[] = [
  { tier: 1, symbol: '$', hint: 'Under $15 a person' },
  { tier: 2, symbol: '$$', hint: '$15–30 a person' },
  { tier: 3, symbol: '$$$', hint: '$30–60 a person' },
  { tier: 4, symbol: '$$$$', hint: '$60+ a person' },
];

export function priceSymbol(tier: PriceTier): string {
  return '$'.repeat(tier);
}
