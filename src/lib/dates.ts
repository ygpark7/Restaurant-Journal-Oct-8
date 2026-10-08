const TIME_ZONE = 'America/New_York';

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: TIME_ZONE,
  });
}

const DAY_MS = 86_400_000;
export const STALE_AFTER_DAYS = 90;

/** "Confirmed 2 weeks ago", plus whether it's old enough that it may be out of date. */
export function describeConfirmed(
  iso: string | null,
  now: Date,
): { text: string; stale: boolean; known: boolean } {
  if (!iso) return { text: 'Not confirmed yet', stale: false, known: false };
  const days = Math.max(
    0,
    Math.floor((now.getTime() - new Date(iso).getTime()) / DAY_MS),
  );
  const stale = days > STALE_AFTER_DAYS;
  let text: string;
  if (days === 0) text = 'Confirmed today';
  else if (days === 1) text = 'Confirmed yesterday';
  else if (days < 14) text = `Confirmed ${days} days ago`;
  else if (days < 56) text = `Confirmed ${Math.floor(days / 7)} weeks ago`;
  else text = `Confirmed ${formatDate(iso)}`;
  return { text, stale, known: true };
}
