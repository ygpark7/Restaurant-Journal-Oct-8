import { Button } from '@/components/Button';
import { Icon } from '@/components/Icon';
import { useToast } from '@/components/Toast';
import { useSavedPlace, useToggleSaved } from './queries';

const STATUS_LABEL = { want_to_try: 'Want to try', been_there: 'Been there' } as const;

/** Tap to save to "Want to try"; tap again to remove. Places you've logged show "Been there". */
export function SaveButton({
  restaurantId,
  name,
}: {
  restaurantId: string;
  name: string;
}) {
  const { data: saved } = useSavedPlace(restaurantId);
  const toggle = useToggleSaved(restaurantId);
  const toast = useToast();

  const isSaved = !!saved;

  function onClick() {
    toggle.mutate(isSaved ? null : 'want_to_try', {
      onSuccess: () =>
        toast(
          isSaved ? `Removed ${name} from My places` : `Saved ${name} to Want to try`,
        ),
      onError: () => toast("Sorry, that didn't save. Please try again."),
    });
  }

  return (
    <Button
      variant={isSaved ? 'secondary' : 'primary'}
      onClick={onClick}
      aria-pressed={isSaved}
      aria-label={
        isSaved ? `Saved as ${STATUS_LABEL[saved.status]}. Tap to remove.` : 'Save'
      }
    >
      <Icon name={isSaved ? 'check' : 'heart'} />
      {isSaved ? STATUS_LABEL[saved.status] : 'Save'}
    </Button>
  );
}
