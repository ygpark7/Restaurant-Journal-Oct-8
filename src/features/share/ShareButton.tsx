import { Button } from '@/components/Button';
import { Icon } from '@/components/Icon';
import { useShare, type ShareInput } from './useShare';

export function ShareButton({
  label = 'Share',
  variant = 'secondary',
  iconOnly = false,
  ...share
}: ShareInput & {
  label?: string;
  variant?: 'secondary' | 'ghost' | 'primary';
  /** A 44px round icon button; the label becomes its accessible name. */
  iconOnly?: boolean;
}) {
  const doShare = useShare();
  return (
    <Button
      variant={variant}
      onClick={() => void doShare(share)}
      aria-label={iconOnly ? label : undefined}
      className={iconOnly ? 'size-11 shrink-0 px-0!' : undefined}
    >
      <Icon name="share" />
      {!iconOnly && label}
    </Button>
  );
}
