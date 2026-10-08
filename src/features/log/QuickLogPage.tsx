import { useState, type FormEvent } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { Button } from '@/components/Button';
import { useToast } from '@/components/Toast';
import type { ConfirmedAttributes, Rating } from '@/domain/types';
import { useRestaurant } from '@/features/restaurants/queries';
import { AttributeConfirmation } from './AttributeConfirmation';
import { PhotoPicker } from './PhotoPicker';
import { useLogVisit } from './queries';
import { RatingScale } from './RatingScale';
import { RestaurantPicker } from './RestaurantPicker';
import { FOOD_SCALE, STRESS_SCALE } from './scales';

function todayInputValue(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** "Today" keeps the real time; a past date is recorded as that evening. */
function toVisitedAt(dateValue: string): string {
  if (!dateValue || dateValue === todayInputValue()) return new Date().toISOString();
  return new Date(`${dateValue}T18:00:00`).toISOString();
}

interface Errors {
  restaurant?: string;
  food?: string;
  stress?: string;
}

export function QuickLogPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const toast = useToast();
  const logVisit = useLogVisit();

  const [restaurantId, setRestaurantId] = useState(params.get('restaurant') ?? '');
  const [food, setFood] = useState<Rating | null>(null);
  const [stress, setStress] = useState<Rating | null>(null);
  const [answers, setAnswers] = useState<ConfirmedAttributes>({});
  const [note, setNote] = useState('');
  const [photo, setPhoto] = useState<string | null>(null);
  const [date, setDate] = useState(todayInputValue);
  const [errors, setErrors] = useState<Errors>({});

  const restaurant = useRestaurant(restaurantId || undefined).data;

  function changeRestaurant(id: string) {
    setRestaurantId(id);
    setAnswers({}); // confirmations belong to one specific place
    setErrors((e) => ({ ...e, restaurant: undefined }));
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    const next: Errors = {};
    if (!restaurantId) next.restaurant = 'Pick the restaurant you visited.';
    if (!food) next.food = 'How was the food?';
    if (!stress) next.stress = 'How stressful was it?';
    setErrors(next);
    if (next.restaurant || next.food || next.stress || !food || !stress) {
      // Move focus to the first problem so keyboard and screen-reader users land on it.
      const first = next.restaurant
        ? '#place-search'
        : next.food
          ? 'input[name=food]'
          : 'input[name=stress]';
      document.querySelector<HTMLElement>(first)?.focus();
      return;
    }

    logVisit.mutate(
      {
        restaurantId,
        visitedAt: toVisitedAt(date),
        foodRating: food,
        stressLevel: stress,
        confirmedAttributes: answers,
        note: note.trim() || undefined,
        photoUrl: photo,
      },
      {
        onSuccess: () => {
          toast(
            `Logged your visit${restaurant ? ` to ${restaurant.name}` : ''}. Thank you!`,
          );
          navigate(`/restaurants/${restaurantId}`);
        },
      },
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-6">
      <header>
        <h1 className="text-3xl font-bold leading-tight">Log a visit</h1>
        <p className="mt-1 text-ink-500">
          Takes about 30 seconds. Future you (and other parents) will thank you.
        </p>
      </header>

      <RestaurantPicker
        value={restaurantId}
        onChange={changeRestaurant}
        error={errors.restaurant}
      />

      <RatingScale
        legend="How was the food?"
        name="food"
        scale={FOOD_SCALE}
        value={food}
        onChange={(v) => {
          setFood(v);
          setErrors((e) => ({ ...e, food: undefined }));
        }}
        error={errors.food}
      />

      <RatingScale
        legend="How stressful was it with the kids?"
        hint="1 = totally relaxed, 5 = chaos"
        name="stress"
        scale={STRESS_SCALE}
        value={stress}
        onChange={(v) => {
          setStress(v);
          setErrors((e) => ({ ...e, stress: undefined }));
        }}
        error={errors.stress}
      />

      {restaurant && (
        <AttributeConfirmation
          restaurant={restaurant}
          answers={answers}
          onChange={setAnswers}
        />
      )}

      <div className="flex flex-col gap-2">
        <label htmlFor="note" className="text-base font-semibold">
          A note for other parents (optional)
        </label>
        <textarea
          id="note"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={3}
          maxLength={500}
          placeholder="Best table, what the kids ate, anything that helped…"
          className="w-full rounded-2xl border-2 border-cream-300 bg-cream-50 p-3 text-base placeholder:text-ink-500 focus:border-sage-600"
        />
      </div>

      <PhotoPicker value={photo} onChange={setPhoto} />

      <div className="flex flex-col gap-2">
        <label htmlFor="visit-date" className="text-base font-semibold">
          When did you go?
        </label>
        <input
          id="visit-date"
          type="date"
          value={date}
          max={todayInputValue()}
          onChange={(e) => setDate(e.target.value)}
          className="h-12 w-fit rounded-full border-2 border-cream-300 bg-cream-50 px-4 text-base focus:border-sage-600"
        />
      </div>

      {logVisit.isError && (
        <p role="alert" className="rounded-card bg-rose-100 p-4 font-medium text-ink-900">
          We couldn&apos;t save your visit. Your answers are still here, so please try
          again.
        </p>
      )}

      <div className="sticky bottom-[calc(var(--spacing-tabbar)+env(safe-area-inset-bottom))] -mx-4 border-t border-cream-300 bg-cream-100/95 px-4 py-3 backdrop-blur md:bottom-0 md:mx-0 md:rounded-card md:border md:px-4">
        <Button type="submit" disabled={logVisit.isPending} className="w-full">
          {logVisit.isPending ? 'Saving…' : 'Save visit'}
        </Button>
      </div>
    </form>
  );
}
