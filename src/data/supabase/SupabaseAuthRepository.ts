import type { AuthError, SupabaseClient, User } from '@supabase/supabase-js';
import type { AuthRepository } from '@/domain/repositories';
import type { AuthUser } from '@/domain/types';

const MAX_DISPLAY_NAME = 40;

export function toAuthUser(user: User | null | undefined): AuthUser | null {
  if (!user) return null;
  const name = user.user_metadata?.display_name;
  return {
    id: user.id,
    email: user.email ?? '',
    displayName: typeof name === 'string' && name.trim() ? name.trim() : undefined,
  };
}

/** Supabase's messages are mostly fine; a few deserve friendlier wording. */
export function friendlyAuthMessage(error: Pick<AuthError, 'message' | 'code'>): string {
  switch (error.code) {
    case 'invalid_credentials':
      return 'That email and password don’t match. Check them and try again.';
    case 'email_not_confirmed':
      return 'Please confirm your email first. Check your inbox for the link we sent.';
    case 'user_already_exists':
    case 'email_exists':
      return 'There’s already an account with that email. Try signing in instead.';
    case 'weak_password':
      return 'Please choose a longer or less common password.';
    case 'over_email_send_rate_limit':
    case 'over_request_rate_limit':
      return 'Too many attempts right now. Please wait a minute and try again.';
    case 'signup_disabled':
    case 'email_provider_disabled':
      return 'Sign-ups by email are turned off for this app.';
    default:
      return error.message;
  }
}

export class SupabaseAuthRepository implements AuthRepository {
  constructor(private client: SupabaseClient) {}

  async getUser() {
    const { data } = await this.client.auth.getSession();
    return toAuthUser(data.session?.user);
  }

  onChange(listener: (user: AuthUser | null) => void) {
    const { data } = this.client.auth.onAuthStateChange((_event, session) => {
      listener(toAuthUser(session?.user));
    });
    return () => data.subscription.unsubscribe();
  }

  async signUp({
    email,
    password,
    displayName,
  }: {
    email: string;
    password: string;
    displayName?: string;
  }) {
    const name = displayName?.trim().slice(0, MAX_DISPLAY_NAME);
    const { data, error } = await this.client.auth.signUp({
      email: email.trim(),
      password,
      options: { data: name ? { display_name: name } : {} },
    });
    if (error) throw new Error(friendlyAuthMessage(error));
    // With "Confirm email" on, Supabase creates the user but returns no session until they click the link.
    return { needsEmailConfirmation: !data.session };
  }

  async signIn({ email, password }: { email: string; password: string }) {
    const { error } = await this.client.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    if (error) throw new Error(friendlyAuthMessage(error));
  }

  async signOut() {
    const { error } = await this.client.auth.signOut();
    if (error) throw new Error(error.message);
  }
}
