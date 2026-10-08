import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router';
import { Skeleton } from '@/components/Skeleton';
import { useAuth } from './AuthProvider';
import { loginPath } from './paths';

/** Wraps pages that only make sense for a signed-in person (their places, logging a visit). */
export function RequireAuth({ children }: { children: ReactNode }) {
  const { status } = useAuth();
  const location = useLocation();

  if (status === 'loading') {
    return (
      <div role="status" className="flex flex-col gap-4">
        <span className="sr-only">Checking your sign-in…</span>
        <Skeleton className="h-10 w-1/2" />
        <Skeleton className="h-40 rounded-card" />
      </div>
    );
  }
  if (status === 'signedOut') {
    return <Navigate to={loginPath(location.pathname + location.search)} replace />;
  }
  return children;
}
