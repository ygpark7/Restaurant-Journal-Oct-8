import type { AuthRepository } from '@/domain/repositories';
import type { AuthUser } from '@/domain/types';
import { simulateNetwork, type MockOptions } from './latency';
import { CURRENT_USER } from './seed/users';
import { mockStore } from './store';

/**
 * Demo auth. There's no real account: you start signed in as the mock user, and signing out and
 * back in works with any email and password (the password is ignored). Real credential checks
 * only exist in the Supabase implementation.
 */
export class MockAuthRepository implements AuthRepository {
  private listeners = new Set<(user: AuthUser | null) => void>();

  constructor(private options: MockOptions) {}

  /** Synchronous read used by the other mock repositories. */
  currentUser(): AuthUser | null {
    const state = mockStore.auth();
    if (state.signedOut) return null;
    return {
      id: CURRENT_USER.id,
      email: state.email ?? 'you@example.test',
      displayName: state.displayName,
    };
  }

  private publish() {
    const user = this.currentUser();
    this.listeners.forEach((listener) => listener(user));
  }

  getUser() {
    return simulateNetwork(this.options, () => this.currentUser());
  }

  onChange(listener: (user: AuthUser | null) => void) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  async signUp({
    email,
    displayName,
  }: {
    email: string;
    password: string;
    displayName?: string;
  }) {
    await simulateNetwork(this.options, () => {
      mockStore.setAuth({ email, displayName: displayName?.trim() || undefined });
    });
    this.publish();
    return { needsEmailConfirmation: false };
  }

  async signIn({ email, password }: { email: string; password: string }) {
    await simulateNetwork(this.options, () => {
      if (!email.trim() || !password) throw new Error('Enter your email and password');
      mockStore.setAuth({ email: email.trim() });
    });
    this.publish();
  }

  async signOut() {
    await simulateNetwork(this.options, () => {
      mockStore.setAuth({ signedOut: true });
    });
    this.publish();
  }
}
