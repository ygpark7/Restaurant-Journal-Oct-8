import type { ReactNode } from 'react';

export function EmptyState({
  emoji = '🍽️',
  title,
  children,
  action,
}: {
  emoji?: string;
  title: string;
  children?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-card bg-cream-50 px-6 py-12 text-center">
      <div className="text-5xl" aria-hidden="true">
        {emoji}
      </div>
      <h2 className="text-xl font-semibold">{title}</h2>
      {children && <p className="max-w-sm text-ink-500">{children}</p>}
      {action}
    </div>
  );
}
