import type { SupabaseClient, User } from '@supabase/supabase-js';
import { describe, expect, it, vi } from 'vitest';
import {
  SupabaseAuthRepository,
  friendlyAuthMessage,
  toAuthUser,
} from './SupabaseAuthRepository';

const user = (extra: Partial<User> = {}) =>
  ({ id: 'u-1', email: 'maya@example.com', user_metadata: {}, ...extra }) as User;

function repoWith(auth: Record<string, unknown>) {
  return new SupabaseAuthRepository({ auth } as unknown as SupabaseClient);
}

describe('toAuthUser', () => {
  it('maps a Supabase user and trims the public display name', () => {
    expect(toAuthUser(user({ user_metadata: { display_name: '  Maya  ' } }))).toEqual({
      id: 'u-1',
      email: 'maya@example.com',
      displayName: 'Maya',
    });
  });

  it('leaves the display name undefined when none was given, and handles no user', () => {
    expect(toAuthUser(user())?.displayName).toBeUndefined();
    expect(
      toAuthUser(user({ user_metadata: { display_name: '   ' } }))?.displayName,
    ).toBeUndefined();
    expect(toAuthUser(null)).toBeNull();
  });
});

describe('friendlyAuthMessage', () => {
  it('rewrites the common failures into plain language', () => {
    expect(friendlyAuthMessage({ code: 'invalid_credentials', message: 'x' })).toMatch(
      /email and password/i,
    );
    expect(friendlyAuthMessage({ code: 'email_exists', message: 'x' })).toMatch(
      /already an account/i,
    );
    expect(
      friendlyAuthMessage({ code: 'something_new', message: 'Original message' }),
    ).toBe('Original message');
  });
});

describe('SupabaseAuthRepository', () => {
  it('signs up with the display name, and reports when email confirmation is needed', async () => {
    const signUp = vi.fn().mockResolvedValue({ data: { session: null }, error: null });
    const result = await repoWith({ signUp }).signUp({
      email: ' maya@example.com ',
      password: 'a-long-password',
      displayName: ' Maya ',
    });

    expect(result).toEqual({ needsEmailConfirmation: true });
    expect(signUp).toHaveBeenCalledWith({
      email: 'maya@example.com',
      password: 'a-long-password',
      options: { data: { display_name: 'Maya' } },
    });
  });

  it('does not need confirmation when Supabase returns a session straight away', async () => {
    const signUp = vi
      .fn()
      .mockResolvedValue({ data: { session: { user: user() } }, error: null });
    expect(
      await repoWith({ signUp }).signUp({ email: 'a@b.co', password: 'secret1' }),
    ).toEqual({
      needsEmailConfirmation: false,
    });
  });

  it('turns auth errors into readable messages', async () => {
    const signInWithPassword = vi.fn().mockResolvedValue({
      error: { code: 'invalid_credentials', message: 'Invalid login credentials' },
    });
    await expect(
      repoWith({ signInWithPassword }).signIn({ email: 'a@b.co', password: 'wrong' }),
    ).rejects.toThrow(/email and password/i);
  });

  it('notifies listeners about sign-in and sign-out, and can unsubscribe', () => {
    let emit: (event: string, session: { user: User } | null) => void = () => {};
    const unsubscribe = vi.fn();
    const onAuthStateChange = vi.fn((callback: typeof emit) => {
      emit = callback;
      return { data: { subscription: { unsubscribe } } };
    });
    const listener = vi.fn();

    const stop = repoWith({ onAuthStateChange }).onChange(listener);
    emit('SIGNED_IN', { user: user() });
    emit('SIGNED_OUT', null);
    stop();

    expect(listener).toHaveBeenNthCalledWith(1, expect.objectContaining({ id: 'u-1' }));
    expect(listener).toHaveBeenNthCalledWith(2, null);
    expect(unsubscribe).toHaveBeenCalled();
  });
});
