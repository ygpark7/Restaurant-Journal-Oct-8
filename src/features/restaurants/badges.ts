import { ATTRIBUTE_DEFS } from '@/domain/attributes.config';
import type { Restaurant } from '@/domain/types';

export interface BadgeInfo {
  key: string;
  emoji: string;
  label: string;
}

/** The positive, card-worthy attributes, in config order (up to `max`). */
export function getBadges(restaurant: Restaurant, max = 4): BadgeInfo[] {
  const badges: BadgeInfo[] = [];
  for (const def of ATTRIBUTE_DEFS) {
    if (!def.showInBadges) continue;
    const state = restaurant.attributes[def.key];
    if (!state) continue;
    if (def.kind === 'boolean' && state.value === true) {
      badges.push({ key: def.key, emoji: def.emoji, label: def.shortLabel });
    } else if (def.kind === 'enum') {
      const option = def.options.find((o) => o.value === state.value);
      if (option) {
        badges.push({ key: def.key, emoji: def.emoji, label: `${option.label} noise` });
      }
    }
  }
  return badges.slice(0, max);
}
