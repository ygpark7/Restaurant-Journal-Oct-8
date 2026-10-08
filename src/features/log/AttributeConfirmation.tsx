import { Button } from '@/components/Button';
import { Chip } from '@/components/Chip';
import {
  ATTRIBUTE_DEFS,
  formatAttributeValue,
  type AttributeKey,
  type AttributeValue,
} from '@/domain/attributes.config';
import type { ConfirmedAttributes, Restaurant } from '@/domain/types';

/**
 * "Tap to confirm": nothing is submitted unless the parent taps it, so we never record a
 * confirmation nobody made. "Everything matches" confirms every listed value in one tap.
 */
export function AttributeConfirmation({
  restaurant,
  answers,
  onChange,
}: {
  restaurant: Restaurant;
  answers: ConfirmedAttributes;
  onChange: (next: ConfirmedAttributes) => void;
}) {
  const listed = Object.fromEntries(
    ATTRIBUTE_DEFS.flatMap((d) => {
      const state = restaurant.attributes[d.key];
      return state ? [[d.key, state.value]] : [];
    }),
  ) as ConfirmedAttributes;
  const hasListed = Object.keys(listed).length > 0;

  function choose(key: AttributeKey, value: AttributeValue) {
    const next = { ...answers };
    if (next[key] === value) delete next[key];
    else next[key] = value;
    onChange(next);
  }

  return (
    <fieldset className="flex flex-col gap-3">
      <legend className="text-base font-semibold">Anything to confirm? (optional)</legend>
      <p className="text-sm text-ink-500">
        Tap what was true when you visited. This keeps the info fresh for other parents.
      </p>
      {hasListed && (
        <div>
          <Button variant="secondary" onClick={() => onChange(listed)}>
            ✓ Everything matches
          </Button>
        </div>
      )}
      <ul className="divide-y divide-cream-300 rounded-card bg-cream-50 px-4 shadow-card">
        {ATTRIBUTE_DEFS.map((def) => {
          const state = restaurant.attributes[def.key];
          const options: { value: AttributeValue; label: string }[] =
            def.kind === 'boolean'
              ? [
                  { value: true, label: 'Yes' },
                  { value: false, label: 'No' },
                ]
              : def.options.map((o) => ({ value: o.value, label: o.label }));
          return (
            <li key={def.key} className="py-3">
              <p className="font-medium">
                <span aria-hidden="true">{def.emoji}</span> {def.label}
              </p>
              <p className="mb-2 text-sm text-ink-500">
                {state
                  ? `Listed: ${formatAttributeValue(def.key, state.value)}`
                  : 'Not listed yet'}
              </p>
              <div role="group" aria-label={def.label} className="flex flex-wrap gap-2">
                {options.map((o) => (
                  <Chip
                    key={String(o.value)}
                    selected={answers[def.key] === o.value}
                    onClick={() => choose(def.key, o.value)}
                  >
                    {o.label}
                  </Chip>
                ))}
              </div>
            </li>
          );
        })}
      </ul>
    </fieldset>
  );
}
