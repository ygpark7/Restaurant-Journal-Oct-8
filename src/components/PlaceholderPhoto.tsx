import { cuisineEmoji } from '@/domain/taxonomy.config';
import { cn } from '@/lib/cn';

const GRADIENTS = [
  'from-apricot-100 to-cream-200',
  'from-sage-100 to-cream-100',
  'from-rose-100 to-apricot-100',
  'from-cream-200 to-sage-100',
  'from-apricot-100 to-sage-100',
];

function hash(text: string): number {
  let h = 0;
  for (const ch of text) h = (h * 31 + ch.charCodeAt(0)) | 0;
  return Math.abs(h);
}

/**
 * Stand-in for restaurant photos while the data is fake: a tinted gradient with the
 * cuisine's emoji. If a real `src` is provided it renders that instead.
 */
export function PlaceholderPhoto({
  id,
  cuisine,
  src,
  alt = '',
  className,
}: {
  id: string;
  cuisine: string;
  src?: string | null;
  alt?: string;
  className?: string;
}) {
  if (src) {
    return <img src={src} alt={alt} className={cn('object-cover', className)} />;
  }
  return (
    <div
      role={alt ? 'img' : undefined}
      aria-label={alt || undefined}
      aria-hidden={alt ? undefined : true}
      className={cn(
        'flex items-center justify-center bg-gradient-to-br text-6xl',
        GRADIENTS[hash(id) % GRADIENTS.length],
        className,
      )}
    >
      <span aria-hidden="true">{cuisineEmoji(cuisine)}</span>
    </div>
  );
}
