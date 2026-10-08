import { Badge } from '@/components/Badge';
import { ATTRIBUTE_DEFS, formatAttributeValue } from '@/domain/attributes.config';
import type { Restaurant } from '@/domain/types';
import { describeConfirmed } from '@/lib/dates';
import { cn } from '@/lib/cn';

/** Every attribute in the config, with its value and when a parent last confirmed it. */
export function KidFriendliness({
  restaurant,
  now,
}: {
  restaurant: Restaurant;
  now: Date;
}) {
  return (
    <section aria-labelledby="kid-friendly-heading" className="flex flex-col gap-3">
      <div>
        <h2 id="kid-friendly-heading" className="text-xl font-semibold">
          Kid-friendliness
        </h2>
        <p className="text-ink-500">
          Reported by parents. Dates show when each detail was last confirmed.
        </p>
      </div>
      <ul className="divide-y divide-cream-300 rounded-card bg-cream-50 px-4 shadow-card">
        {ATTRIBUTE_DEFS.map((def) => {
          const state = restaurant.attributes[def.key];
          const confirmed = describeConfirmed(state?.lastConfirmedAt ?? null, now);
          const yes = state?.value === true;
          return (
            <li key={def.key} className="flex items-center justify-between gap-3 py-3">
              <div className="flex min-w-0 items-start gap-3">
                <span aria-hidden="true" className="text-2xl leading-none">
                  {def.emoji}
                </span>
                <div className="min-w-0">
                  <p className="font-medium">{def.label}</p>
                  <p
                    className={cn(
                      'text-sm',
                      confirmed.stale ? 'text-apricot-700' : 'text-ink-500',
                    )}
                  >
                    {state?.lastConfirmedAt ? (
                      <time dateTime={state.lastConfirmedAt}>{confirmed.text}</time>
                    ) : (
                      confirmed.text
                    )}
                    {confirmed.stale && ' · may be out of date'}
                  </p>
                </div>
              </div>
              {state ? (
                <Badge
                  tone={yes || def.kind === 'enum' ? 'sage' : 'neutral'}
                  className="shrink-0"
                >
                  {def.kind === 'boolean' && (yes ? '✓ ' : '✗ ')}
                  {formatAttributeValue(def.key, state.value)}
                </Badge>
              ) : (
                <Badge tone="neutral" className="shrink-0">
                  Unknown
                </Badge>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
