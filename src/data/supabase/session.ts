import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Anonymous identity: the first time someone writes something (saves a place, logs a visit)
 * we sign them in anonymously. Supabase keeps that session in localStorage, so the same
 * browser keeps the same user. Adding real login later keeps the same user ids
 * (anonymous users can be upgraded in place).
 *
 * Reading public data (restaurants, parents' notes) never creates a user.
 */
export class AnonymousSession {
  private pending: Promise<string> | null = null;

  constructor(private client: Pick<SupabaseClient, 'auth'>) {}

  /** The current user's id if there already is a session; never signs anyone in. */
  async peekUserId(): Promise<string | null> {
    const { data } = await this.client.auth.getSession();
    return data.session?.user.id ?? null;
  }

  /** The current user's id, signing in anonymously first if needed. */
  userId(): Promise<string> {
    this.pending ??= this.resolve().catch((error: unknown) => {
      this.pending = null; // allow a retry
      throw error;
    });
    return this.pending;
  }

  private async resolve(): Promise<string> {
    const existing = await this.peekUserId();
    if (existing) return existing;

    const { data, error } = await this.client.auth.signInAnonymously();
    if (error || !data.user) {
      throw new Error(
        `Couldn't start an anonymous session (${error?.message ?? 'no user returned'}). ` +
          'In Supabase, enable Authentication → Sign In / Providers → "Allow anonymous sign-ins".',
      );
    }
    return data.user.id;
  }
}
