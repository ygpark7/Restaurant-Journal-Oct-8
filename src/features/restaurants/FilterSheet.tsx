import { BottomSheet } from '@/components/BottomSheet';
import { Button } from '@/components/Button';
import { Chip } from '@/components/Chip';
import {
  ATTRIBUTE_DEFS,
  type AttributeKey,
  type AttributeValue,
} from '@/domain/attributes.config';
import { CUISINES, PRICE_TIERS } from '@/domain/taxonomy.config';
import type { RestaurantFilters } from '@/domain/types';
import { toggleInList } from './filterParams';

function Group({
  legend,
  hint,
  children,
}: {
  legend: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="border-t border-cream-300 py-4 first:border-t-0">
      <fieldset>
        <legend className="mb-1 text-base font-semibold">{legend}</legend>
        {hint && <p className="mb-2 text-sm text-ink-500">{hint}</p>}
        <div className="mt-2 flex flex-wrap gap-2">{children}</div>
      </fieldset>
    </div>
  );
}

/**
 * Filters apply live (they're URL state), so there's no draft/apply step: "Show N places"
 * just closes the sheet. Groups are generated from the attribute and taxonomy configs.
 */
export function FilterSheet({
  open,
  onClose,
  filters,
  update,
  clearAll,
  resultCount,
}: {
  open: boolean;
  onClose: () => void;
  filters: RestaurantFilters;
  update: (patch: Partial<RestaurantFilters>) => void;
  clearAll: () => void;
  resultCount: number | undefined;
}) {
  function toggleAttribute(key: AttributeKey, value: AttributeValue) {
    const next = { ...filters.attributes };
    const list = toggleInList(next[key], value);
    if (list) next[key] = list;
    else delete next[key];
    update({ attributes: Object.keys(next).length ? next : undefined });
  }

  const booleanDefs = ATTRIBUTE_DEFS.filter((d) => d.kind === 'boolean');
  const enumDefs = ATTRIBUTE_DEFS.filter((d) => d.kind === 'enum');

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      title="Filters"
      footer={
        <div className="flex items-center justify-between gap-3">
          <Button variant="ghost" onClick={clearAll}>
            Clear all
          </Button>
          <Button onClick={onClose} className="flex-1">
            {resultCount === undefined
              ? 'Show places'
              : `Show ${resultCount} ${resultCount === 1 ? 'place' : 'places'}`}
          </Button>
        </div>
      }
    >
      <Group
        legend="Kid-friendly must-haves"
        hint="Only show places confirmed to have these."
      >
        {booleanDefs.map((def) => (
          <Chip
            key={def.key}
            selected={!!filters.attributes?.[def.key]?.includes(true)}
            onClick={() => toggleAttribute(def.key, true)}
          >
            <span aria-hidden="true">{def.emoji}</span> {def.label}
          </Chip>
        ))}
      </Group>

      {enumDefs.map((def) => (
        <Group key={def.key} legend={def.label} hint="Pick one or more.">
          {def.kind === 'enum' &&
            def.options.map((option) => (
              <Chip
                key={option.value}
                selected={!!filters.attributes?.[def.key]?.includes(option.value)}
                onClick={() => toggleAttribute(def.key, option.value)}
              >
                {option.label}
              </Chip>
            ))}
        </Group>
      ))}

      <Group legend="Cuisine">
        {CUISINES.map((c) => (
          <Chip
            key={c.label}
            selected={!!filters.cuisines?.includes(c.label)}
            onClick={() => update({ cuisines: toggleInList(filters.cuisines, c.label) })}
          >
            <span aria-hidden="true">{c.emoji}</span> {c.label}
          </Chip>
        ))}
      </Group>

      <Group legend="Price">
        {PRICE_TIERS.map((p) => (
          <Chip
            key={p.tier}
            selected={!!filters.priceTiers?.includes(p.tier)}
            onClick={() =>
              update({ priceTiers: toggleInList(filters.priceTiers, p.tier) })
            }
            aria-label={`${p.symbol}, ${p.hint}`}
            title={p.hint}
          >
            {p.symbol}
          </Chip>
        ))}
      </Group>
    </BottomSheet>
  );
}
