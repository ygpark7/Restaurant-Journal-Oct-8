import { describe, expect, it, vi } from 'vitest';
import { AnonymousSession } from './session';

type AuthStub = ConstructorParameters<typeof AnonymousSession>[0];

function fakeClient(options: { existingUser?: string; signIn?: () => unknown }) {
  const getSession = vi.fn().mockResolvedValue({
    data: {
      session: options.existingUser ? { user: { id: options.existingUser } } : null,
    },
  });
  const signInAnonymously = vi.fn(
    options.signIn ??
      (() => Promise.resolve({ data: { user: { id: 'new-user' } }, error: null })),
  );
  return {
    client: { auth: { getSession, signInAnonymously } } as unknown as AuthStub,
    getSession,
    signInAnonymously,
  };
}

describe('AnonymousSession', () => {
  it('peeking never signs anyone in', async () => {
    const { client, signInAnonymously } = fakeClient({});
    expect(await new AnonymousSession(client).peekUserId()).toBeNull();
    expect(signInAnonymously).not.toHaveBeenCalled();
  });

  it('reuses an existing session instead of creating a new user', async () => {
    const { client, signInAnonymously } = fakeClient({ existingUser: 'existing' });
    expect(await new AnonymousSession(client).userId()).toBe('existing');
    expect(signInAnonymously).not.toHaveBeenCalled();
  });

  it('signs in anonymously once, even for concurrent callers', async () => {
    const { client, signInAnonymously } = fakeClient({});
    const session = new AnonymousSession(client);
    const ids = await Promise.all([session.userId(), session.userId(), session.userId()]);
    expect(ids).toEqual(['new-user', 'new-user', 'new-user']);
    expect(signInAnonymously).toHaveBeenCalledTimes(1);
  });

  it('explains how to fix it when anonymous sign-ins are disabled, and can retry', async () => {
    let fail = true;
    const { client, signInAnonymously } = fakeClient({
      signIn: () =>
        Promise.resolve(
          fail
            ? {
                data: { user: null },
                error: { message: 'Anonymous sign-ins are disabled' },
              }
            : { data: { user: { id: 'new-user' } }, error: null },
        ),
    });
    const session = new AnonymousSession(client);

    await expect(session.userId()).rejects.toThrow(/Allow anonymous sign-ins/);

    fail = false;
    expect(await session.userId()).toBe('new-user');
    expect(signInAnonymously).toHaveBeenCalledTimes(2);
  });
});
