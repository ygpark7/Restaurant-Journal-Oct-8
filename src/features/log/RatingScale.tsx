import { cn } from '@/lib/cn';
import type { Rating } from '@/domain/types';
import type { ScaleStep } from './scales';

/**
 * Five big emoji choices. Built on native radio inputs, so screen readers announce
 * "1 of 5" and arrow keys work, while the visuals stay large and tappable.
 */
export function RatingScale({
  legend,
  hint,
  name,
  scale,
  value,
  onChange,
  error,
}: {
  legend: string;
  hint?: string;
  name: string;
  scale: readonly ScaleStep[];
  value: Rating | null;
  onChange: (value: Rating) => void;
  error?: string;
}) {
  return (
    <fieldset aria-describedby={error ? `${name}-error` : undefined}>
      <legend className="text-base font-semibold">{legend}</legend>
      {hint && <p className="text-sm text-ink-500">{hint}</p>}
      <div className="mt-2 grid grid-cols-5 gap-1.5">
        {scale.map((step) => (
          <label key={step.value} className="cursor-pointer">
            <input
              type="radio"
              name={name}
              value={step.value}
              checked={value === step.value}
              onChange={() => onChange(step.value)}
              className="peer sr-only"
            />
            <span
              className={cn(
                'flex min-h-[4.5rem] flex-col items-center justify-center gap-0.5 rounded-2xl border-2 border-cream-300 bg-cream-50 px-0.5 py-2 text-center transition-colors',
                'peer-checked:border-sage-600 peer-checked:bg-sage-100 peer-focus-visible:outline-3 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-sage-600',
              )}
            >
              <span aria-hidden="true" className="text-3xl leading-none">
                {step.emoji}
              </span>
              <span className="text-xs font-medium leading-tight text-ink-700">
                {step.label}
              </span>
            </span>
          </label>
        ))}
      </div>
      {error && (
        <p
          id={`${name}-error`}
          role="alert"
          className="mt-2 text-sm font-medium text-rose-600"
        >
          {error}
        </p>
      )}
    </fieldset>
  );
}
