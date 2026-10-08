import { useState } from 'react';
import { Navigate, useLocation } from 'react-router';
import { Button } from '@/components/Button';
import { Skeleton } from '@/components/Skeleton';
import { useAuth } from './AuthProvider';
import { loginPath } from './paths';

export function AccountPage() {
  const { status, user, signOut } = useAuth();
  const location = useLocation();
  const [leaving, setLeaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSignOut() {
    setLeaving(true);
    setError(null);
    try {
      await signOut();
    } catch (e) {
      setLeaving(false);
      setError(
        e instanceof Error ? e.message : "We couldn't sign you out. Please try again.",
      );
    }
  }

  if (status === 'loading') {
    return (
      <div role="status" className="mx-auto flex max-w-md flex-col gap-4">
        <span className="sr-only">Loading your account…</span>
        <Skeleton className="h-10 w-1/2" />
        <Skeleton className="h-32 rounded-card" />
      </div>
    );
  }

  if (status === 'signedOut') {
    // Signing out on purpose goes home; arriving here signed out goes to login.
    return <Navigate to={leaving ? '/' : loginPath(location.pathname)} replace />;
  }

  return (
    <div className="mx-auto flex max-w-md flex-col gap-6">
      <h1 className="text-3xl font-bold leading-tight">Account</h1>
      <dl className="flex flex-col gap-4 rounded-card bg-cream-50 p-5 shadow-card">
        <div>
          <dt className="text-sm text-ink-500">Signed in as</dt>
          <dd className="break-all text-lg font-semibold">{user?.email}</dd>
        </div>
        <div>
          <dt className="text-sm text-ink-500">Name on your notes</dt>
          <dd className="text-lg font-semibold">{user?.displayName ?? 'A parent'}</dd>
        </div>
      </dl>
      {error && (
        <p role="alert" className="rounded-2xl bg-rose-100 px-4 py-3 font-medium">
          {error}
        </p>
      )}
      <Button variant="secondary" onClick={() => void onSignOut()} disabled={leaving}>
        {leaving ? 'Signing out…' : 'Sign out'}
      </Button>
    </div>
  );
}
