import { Link } from 'react-router';
import { buttonClasses } from '@/components/Button';
import { ErrorState } from '@/components/ErrorState';
import { Skeleton } from '@/components/Skeleton';
import { formatDate } from '@/lib/dates';
import { useRestaurantVisits } from '@/features/log/queries';
import { FOOD_SCALE, STRESS_SCALE, scaleStep } from '@/features/log/scales';

/** Notes are visits that include a note, shown newest first. */
export function ParentNotes({ restaurantId }: { restaurantId: string }) {
  const { data, isPending, isError, refetch } = useRestaurantVisits(restaurantId);

  return (
    <section aria-labelledby="notes-heading" className="flex flex-col gap-3">
      <h2 id="notes-heading" className="text-xl font-semibold">
        Notes from parents
      </h2>

      {isPending ? (
        <div role="status" className="flex flex-col gap-3">
          <span className="sr-only">Loading notes…</span>
          <Skeleton className="h-24 rounded-card" />
          <Skeleton className="h-24 rounded-card" />
        </div>
      ) : isError ? (
        <ErrorState title="We couldn't load notes" onRetry={() => void refetch()} />
      ) : data.filter((v) => v.note).length === 0 ? (
        <div className="flex flex-col items-start gap-3 rounded-card bg-cream-50 p-4 shadow-card">
          <p className="text-ink-700">
            No notes yet. Been here? Tell the next parent what to expect.
          </p>
          <Link
            to={`/log?restaurant=${restaurantId}`}
            className={buttonClasses('secondary')}
          >
            Log a visit
          </Link>
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {data
            .filter((v) => v.note)
            .map((visit) => {
              const food = scaleStep(FOOD_SCALE, visit.foodRating);
              const stress = scaleStep(STRESS_SCALE, visit.stressLevel);
              return (
                <li key={visit.id} className="rounded-card bg-cream-50 p-4 shadow-card">
                  <p className="flex items-center gap-2 text-sm text-ink-500">
                    <span aria-hidden="true" className="text-xl">
                      {visit.author.avatarEmoji ?? '🙂'}
                    </span>
                    <span className="font-semibold text-ink-700">
                      {visit.author.displayName}
                    </span>
                    <span aria-hidden="true">·</span>
                    <time dateTime={visit.visitedAt}>{formatDate(visit.visitedAt)}</time>
                  </p>
                  <p className="mt-2 text-base">{visit.note}</p>
                  <p className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-ink-700">
                    <span>
                      Food: <span aria-hidden="true">{food.emoji}</span> {food.label}
                    </span>
                    <span>
                      Stress: <span aria-hidden="true">{stress.emoji}</span>{' '}
                      {stress.label}
                    </span>
                  </p>
                </li>
              );
            })}
        </ul>
      )}
    </section>
  );
}
