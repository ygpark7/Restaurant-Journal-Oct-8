import { Button } from './Button';

export function ErrorState({
  title = 'Something went wrong',
  message = "We couldn't load this. Please try again.",
  onRetry,
}: {
  title?: string;
  message?: string;
  onRetry?: () => void;
}) {
  return (
    <div
      role="alert"
      className="flex flex-col items-center gap-3 rounded-card bg-rose-100 px-6 py-10 text-center"
    >
      <div className="text-5xl" aria-hidden="true">
        😕
      </div>
      <h2 className="text-xl font-semibold text-ink-900">{title}</h2>
      <p className="max-w-sm text-ink-700">{message}</p>
      {onRetry && (
        <Button variant="secondary" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  );
}
