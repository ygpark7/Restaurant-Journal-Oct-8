import type { SupabaseClient } from '@supabase/supabase-js';
import { NotSignedInError } from '@/domain/repositories';

/**
 * Who is signed in. Supabase keeps the session in localStorage and refreshes it for us.
 * Reading public data (restaurants, parents' notes) never needs a session; writes do.
 */
export class AuthSession {
  constructor(private client: Pick<SupabaseClient, 'auth'>) {}

  /** The current user's id, or null when signed out. */
  async peekUserId(): Promise<string | null> {
    const { data } = await this.client.auth.getSession();
    return data.session?.user.id ?? null;
  }

  /** The current user's id; rejects with NotSignedInError when signed out. */
  async requireUserId(): Promise<string> {
    const id = await this.peekUserId();
    if (!id) throw new NotSignedInError();
    return id;
  }
}
