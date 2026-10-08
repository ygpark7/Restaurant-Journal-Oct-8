import type { ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';

/** Shared with <Link>s that should look like buttons. All sizes meet the 44px tap target. */
export function buttonClasses(variant: Variant = 'primary', className?: string) {
  return cn(
    'inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-5 text-base font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50',
    variant === 'primary' && 'bg-sage-600 text-white hover:bg-sage-700',
    variant === 'secondary' &&
      'border-2 border-sage-600 bg-transparent text-sage-700 hover:bg-sage-50',
    variant === 'ghost' && 'text-ink-700 hover:bg-cream-200',
    variant === 'danger' && 'text-rose-600 hover:bg-rose-100',
    className,
  );
}

export function Button({
  variant = 'primary',
  className,
  type = 'button',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return <button type={type} className={buttonClasses(variant, className)} {...props} />;
}
