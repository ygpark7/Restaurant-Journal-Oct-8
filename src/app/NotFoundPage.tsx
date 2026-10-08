import { Link } from 'react-router';
import { buttonClasses } from '@/components/Button';
import { EmptyState } from '@/components/EmptyState';

export function NotFoundPage() {
  return (
    <EmptyState
      emoji="🧭"
      title="We couldn't find that page"
      action={
        <Link to="/" className={buttonClasses('primary')}>
          Back to Discover
        </Link>
      }
    />
  );
}
