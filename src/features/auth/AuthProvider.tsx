import { useQueryClient } from '@tanstack/react-query';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import type { SignUpResult } from '@/domain/repositories';
import type { AuthUser } from '@/domain/types';
import { savedKeys } from '@/features/lists/queries';
import { visitKeys } from '@/features/log/queries';
import { useRepositories } from '@/lib/repositories-context';

type AuthState =
  | { status: 'loading'; user: null }
  | { status: 'signedOut'; user: null }
  | { status: 'signedIn'; user: AuthUser };

interface AuthContextValue {
  status: AuthState['status'];
  user: AuthUser | null;
  signIn: (input: { email: string; password: string }) => Promise<void>;
  signUp: (input: {
    email: string;
    password: string;
    displayName?: string;
  }) => Promise<SignUpResult>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { auth } = useRepositories();
  const queryClient = useQueryClient();
  const [state, setState] = useState<AuthState>({ status: 'loading', user: null });
  const lastUserId = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    let active = true;

    const apply = (user: AuthUser | null) => {
      if (!active) return;
      setState(user ? { status: 'signedIn', user } : { status: 'signedOut', user: null });
      // Saved places and visits belong to a person: when who is signed in changes, drop them.
      const id = user?.id ?? null;
      if (lastUserId.current !== undefined && lastUserId.current !== id) {
        queryClient.removeQueries({ queryKey: savedKeys.all });
        void queryClient.invalidateQueries({ queryKey: visitKeys.all });
      }
      lastUserId.current = id;
    };

    auth.getUser().then(apply, () => apply(null));
    const unsubscribe = auth.onChange(apply);
    return () => {
      active = false;
      unsubscribe();
    };
  }, [auth, queryClient]);

  const signIn = useCallback(
    (input: { email: string; password: string }) => auth.signIn(input),
    [auth],
  );
  const signUp = useCallback(
    (input: { email: string; password: string; displayName?: string }) =>
      auth.signUp(input),
    [auth],
  );
  const signOut = useCallback(() => auth.signOut(), [auth]);

  const value = useMemo<AuthContextValue>(
    () => ({ status: state.status, user: state.user, signIn, signUp, signOut }),
    [state, signIn, signUp, signOut],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth must be used inside <AuthProvider>');
  return value;
}
