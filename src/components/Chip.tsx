import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/cn';

/** A toggle chip. Announces its state to screen readers via aria-pressed. */
export function Chip({
  selected,
  strongOutline = false,
  children,
  className,
  ...props
}: {
  selected: boolean;
  /** A darker resting outline, used by the Discover quick filters. */
  strongOutline?: boolean;
  children: ReactNode;
} & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      className={cn(
        'inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-full border-2 px-4 text-[0.95rem] font-medium transition-colors',
        selected
          ? 'border-sage-600 bg-sage-600 text-white'
          : cn(
              'bg-cream-50 text-ink-700 hover:border-sage-600',
              strongOutline ? 'border-ink-700' : 'border-cream-300',
            ),
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}
