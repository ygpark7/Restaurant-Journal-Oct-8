import { useState, type FormEvent } from 'react';
import { Navigate, useNavigate, useSearchParams } from 'react-router';
import { Button } from '@/components/Button';
import { useAuth } from './AuthProvider';
import { safeNext } from './paths';

type Mode = 'signin' | 'signup';

const inputClass =
  'h-12 w-full rounded-2xl border-2 border-cream-300 bg-cream-50 px-4 text-base placeholder:text-ink-500 focus:border-sage-600';

export function LoginPage() {
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const { status, signIn, signUp } = useAuth();
  const next = safeNext(params.get('next'));
  const mode: Mode = params.get('mode') === 'signup' ? 'signup' : 'signin';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [confirmEmailFor, setConfirmEmailFor] = useState<string | null>(null);

  // Already signed in (or just finished): go where they were headed.
  if (status === 'signedIn' && !confirmEmailFor) return <Navigate to={next} replace />;

  function switchMode(nextMode: Mode) {
    setError(null);
    const copy = new URLSearchParams(params);
    if (nextMode === 'signup') copy.set('mode', 'signup');
    else copy.delete('mode');
    setParams(copy, { replace: true });
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setPending(true);
    try {
      if (mode === 'signup') {
        const result = await signUp({ email, password, displayName });
        if (result.needsEmailConfirmation) {
          setConfirmEmailFor(email.trim());
          return;
        }
      } else {
        await signIn({ email, password });
      }
      navigate(next, { replace: true });
    } catch (e) {
      setError(
        e instanceof Error ? e.message : 'Something went wrong. Please try again.',
      );
    } finally {
      setPending(false);
    }
  }

  if (confirmEmailFor) {
    return (
      <div className="mx-auto flex max-w-md flex-col gap-4 rounded-card bg-cream-50 p-6 text-center shadow-card">
        <div className="text-5xl" aria-hidden="true">
          📬
        </div>
        <h1 className="text-2xl font-bold">Check your email</h1>
        <p className="text-ink-700">
          We sent a link to <strong>{confirmEmailFor}</strong>. Tap it to confirm your
          account, then come back here to sign in.
        </p>
        <Button
          variant="secondary"
          onClick={() => {
            setConfirmEmailFor(null);
            switchMode('signin');
          }}
        >
          Back to sign in
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-md flex-col gap-6">
      <header>
        <h1 className="text-3xl font-bold leading-tight">
          {mode === 'signup' ? 'Create your account' : 'Sign in'}
        </h1>
        <p className="mt-1 text-ink-500">
          {mode === 'signup'
            ? 'Save places, log visits, and share notes with other parents.'
            : 'Welcome back. Your saved places and visits are waiting.'}
        </p>
      </header>

      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="email" className="text-base font-semibold">
            Email
          </label>
          <input
            id="email"
            type="email"
            name="email"
            autoComplete="email"
            inputMode="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={inputClass}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="password" className="text-base font-semibold">
            Password
          </label>
          <input
            id="password"
            type="password"
            name="password"
            autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            aria-describedby={mode === 'signup' ? 'password-hint' : undefined}
            className={inputClass}
          />
          {mode === 'signup' && (
            <p id="password-hint" className="text-sm text-ink-500">
              At least 6 characters.
            </p>
          )}
        </div>

        {mode === 'signup' && (
          <div className="flex flex-col gap-1.5">
            <label htmlFor="display-name" className="text-base font-semibold">
              Name for your notes (optional)
            </label>
            <input
              id="display-name"
              type="text"
              name="displayName"
              autoComplete="nickname"
              maxLength={40}
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              aria-describedby="display-name-hint"
              placeholder="e.g. Sam, dad of 2"
              className={inputClass}
            />
            <p id="display-name-hint" className="text-sm text-ink-500">
              Shown publicly next to your notes. Leave it blank to appear as &ldquo;A
              parent&rdquo;. We never show your email.
            </p>
          </div>
        )}

        {error && (
          <p
            role="alert"
            className="rounded-2xl bg-rose-100 px-4 py-3 font-medium text-ink-900"
          >
            {error}
          </p>
        )}

        <Button type="submit" disabled={pending} className="w-full">
          {pending ? 'One moment…' : mode === 'signup' ? 'Create account' : 'Sign in'}
        </Button>
      </form>

      <p className="text-center text-ink-700">
        {mode === 'signup' ? 'Already have an account?' : 'New here?'}{' '}
        <button
          type="button"
          onClick={() => switchMode(mode === 'signup' ? 'signin' : 'signup')}
          className="min-h-11 font-semibold text-sage-700 underline underline-offset-4"
        >
          {mode === 'signup' ? 'Sign in' : 'Create an account'}
        </button>
      </p>
    </div>
  );
}
