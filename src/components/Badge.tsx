import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

export function Badge({
  children,
  tone = 'sage',
  className,
}: {
  children: ReactNode;
  tone?: 'sage' | 'apricot' | 'neutral';
  className?: string;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-sm font-medium',
        tone === 'sage' && 'bg-sage-100 text-sage-700',
        tone === 'apricot' && 'bg-apricot-100 text-apricot-700',
        tone === 'neutral' && 'bg-cream-200 text-ink-700',
        className,
      )}
    >
      {children}
    </span>
  );
}
