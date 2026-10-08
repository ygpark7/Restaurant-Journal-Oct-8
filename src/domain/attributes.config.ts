/**
 * Kid-friendly attributes: the single source of truth.
 *
 * To add, remove, or rename an attribute, edit this list. Filters, badges, the detail
 * page, and the quick-log confirmation step are all generated from it.
 *
 * Storage note: attributes are stored by `key`, so renaming a `label` is free, but
 * renaming a `key` means migrating stored data.
 */

export interface AttributeOption {
  value: string;
  label: string;
}

interface AttributeDefBase {
  /** Stable identifier used in storage and URLs. */
  key: string;
  /** Full label, e.g. on the detail page. */
  label: string;
  /** Short label for badges and chips. */
  shortLabel: string;
  emoji: string;
  /** Show as a badge on restaurant cards when this attribute is true / has a value. */
  showInBadges: boolean;
  /** Show as a quick-filter chip on Discover. */
  showInQuickFilters: boolean;
}

export interface BooleanAttributeDef extends AttributeDefBase {
  kind: 'boolean';
}

export interface EnumAttributeDef extends AttributeDefBase {
  kind: 'enum';
  options: readonly AttributeOption[];
}

export type AttributeDef = BooleanAttributeDef | EnumAttributeDef;

export const ATTRIBUTE_DEFS = [
  {
    key: 'kidsMenu',
    label: 'Kids menu',
    shortLabel: 'Kids menu',
    emoji: '🍝',
    kind: 'boolean',
    showInBadges: true,
    showInQuickFilters: true,
  },
  {
    key: 'highChairs',
    label: 'High chairs',
    shortLabel: 'High chairs',
    emoji: '🪑',
    kind: 'boolean',
    showInBadges: true,
    showInQuickFilters: true,
  },
  {
    key: 'strollerFriendly',
    label: 'Stroller-friendly',
    shortLabel: 'Strollers OK',
    emoji: '🛒',
    kind: 'boolean',
    showInBadges: true,
    showInQuickFilters: true,
  },
  {
    key: 'noiseLevel',
    label: 'Noise level',
    shortLabel: 'Noise',
    emoji: '🔊',
    kind: 'enum',
    options: [
      { value: 'quiet', label: 'Quiet' },
      { value: 'moderate', label: 'Moderate' },
      { value: 'lively', label: 'Lively' },
    ],
    showInBadges: true,
    showInQuickFilters: false,
  },
  {
    key: 'changingTable',
    label: 'Changing table',
    shortLabel: 'Changing table',
    emoji: '👶',
    kind: 'boolean',
    showInBadges: true,
    showInQuickFilters: true,
  },
  {
    key: 'takesReservations',
    label: 'Takes reservations',
    shortLabel: 'Reservations',
    emoji: '📅',
    kind: 'boolean',
    showInBadges: false,
    showInQuickFilters: false,
  },
  {
    key: 'walkInsWelcome',
    label: 'Walk-ins welcome',
    shortLabel: 'Walk-ins OK',
    emoji: '🚶',
    kind: 'boolean',
    showInBadges: true,
    showInQuickFilters: true,
  },
] as const satisfies readonly AttributeDef[];

export type AttributeKey = (typeof ATTRIBUTE_DEFS)[number]['key'];

/** A boolean for yes/no attributes, or the chosen option's `value` for enum attributes. */
export type AttributeValue = boolean | string;

export const ATTRIBUTE_KEYS: readonly AttributeKey[] = ATTRIBUTE_DEFS.map((d) => d.key);

const DEFS_BY_KEY: Record<string, AttributeDef> = Object.fromEntries(
  ATTRIBUTE_DEFS.map((d) => [d.key, d as AttributeDef]),
);

export function getAttributeDef(key: AttributeKey): AttributeDef {
  return DEFS_BY_KEY[key]!;
}

/** The attribute that powers the "Good for tonight" toggle. */
export const WALK_IN_KEY: AttributeKey = 'walkInsWelcome';

/** Human-readable text for a value, e.g. "Yes", "No", "Quiet". */
export function formatAttributeValue(key: AttributeKey, value: AttributeValue): string {
  const def = getAttributeDef(key);
  if (def.kind === 'enum') {
    return def.options.find((o) => o.value === value)?.label ?? String(value);
  }
  return value === true ? 'Yes' : 'No';
}
