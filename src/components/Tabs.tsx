import { useRef, type KeyboardEvent } from 'react';
import { cn } from '@/lib/cn';

export interface TabItem<T extends string> {
  id: T;
  label: string;
  count?: number;
}

/**
 * Accessible tab list (arrow keys move between tabs). The caller renders the panel and
 * should give it role="tabpanel" with aria-labelledby={`tab-${id}`}.
 */
export function Tabs<T extends string>({
  tabs,
  value,
  onChange,
  label,
}: {
  tabs: TabItem<T>[];
  value: T;
  onChange: (id: T) => void;
  label: string;
}) {
  const refs = useRef<Record<string, HTMLButtonElement | null>>({});

  function onKeyDown(e: KeyboardEvent, index: number) {
    const delta = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
    if (!delta) return;
    e.preventDefault();
    const next = tabs[(index + delta + tabs.length) % tabs.length]!;
    onChange(next.id);
    refs.current[next.id]?.focus();
  }

  return (
    <div role="tablist" aria-label={label} className="flex rounded-full bg-cream-200 p-1">
      {tabs.map((tab, i) => {
        const selected = tab.id === value;
        return (
          <button
            key={tab.id}
            ref={(el) => {
              refs.current[tab.id] = el;
            }}
            role="tab"
            id={`tab-${tab.id}`}
            type="button"
            aria-selected={selected}
            tabIndex={selected ? 0 : -1}
            onClick={() => onChange(tab.id)}
            onKeyDown={(e) => onKeyDown(e, i)}
            className={cn(
              'min-h-11 flex-1 rounded-full px-4 text-base font-semibold transition-colors',
              selected
                ? 'bg-cream-50 text-sage-700 shadow-card'
                : 'text-ink-500 hover:text-ink-900',
            )}
          >
            {tab.label}
            {tab.count !== undefined && (
              <span className="ml-1.5 font-normal">({tab.count})</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
