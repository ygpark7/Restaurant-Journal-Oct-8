import { describe, expect, it, vi } from 'vitest';
import { NotSignedInError } from '@/domain/repositories';
import { AuthSession } from './session';

type AuthStub = ConstructorParameters<typeof AuthSession>[0];

function fakeClient(userId?: string) {
  const getSession = vi.fn().mockResolvedValue({
    data: { session: userId ? { user: { id: userId } } : null },
  });
  return { auth: { getSession } } as unknown as AuthStub;
}

describe('AuthSession', () => {
  it('peeks at the current user without requiring one', async () => {
    expect(await new AuthSession(fakeClient('u-1')).peekUserId()).toBe('u-1');
    expect(await new AuthSession(fakeClient()).peekUserId()).toBeNull();
  });

  it('requires a signed-in user for writes', async () => {
    expect(await new AuthSession(fakeClient('u-1')).requireUserId()).toBe('u-1');
    await expect(new AuthSession(fakeClient()).requireUserId()).rejects.toBeInstanceOf(
      NotSignedInError,
    );
  });
});
