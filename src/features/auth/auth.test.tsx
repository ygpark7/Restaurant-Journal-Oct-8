import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route, Routes, useLocation } from 'react-router';
import { describe, expect, it } from 'vitest';
import { createMockRepositories } from '@/data/mock/MockRepositories';
import type { AuthRepository, Repositories } from '@/domain/repositories';
import { SaveButton } from '@/features/lists/SaveButton';
import { renderWithProviders } from '@/test/renderWithProviders';
import { AccountPage } from './AccountPage';
import { LoginPage } from './LoginPage';
import { RequireAuth } from './RequireAuth';

const signedOut = () =>
  localStorage.setItem('rj:v1:auth', JSON.stringify({ signedOut: true }));

function Where() {
  const { pathname, search } = useLocation();
  return <p>at {pathname + search}</p>;
}

function renderApp(route: string, repositories?: Repositories) {
  return renderWithProviders(
    <Routes>
      <Route
        path="/log"
        element={
          <RequireAuth>
            <p>Secret log page</p>
          </RequireAuth>
        }
      />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/account" element={<AccountPage />} />
      <Route
        path="/restaurants/:id"
        element={<SaveButton restaurantId="r-duane-dough" name="Duane Dough" />}
      />
      <Route path="*" element={<Where />} />
    </Routes>,
    { route, repositories },
  );
}

describe('email login', () => {
  it('sends signed-out visitors to the login page, then back where they were going', async () => {
    signedOut();
    const user = userEvent.setup();
    renderApp('/log?restaurant=r-duane-dough');

    expect(await screen.findByRole('heading', { name: 'Sign in' })).toBeInTheDocument();
    expect(screen.queryByText('Secret log page')).not.toBeInTheDocument();

    await user.type(screen.getByLabelText('Email'), 'maya@example.com');
    await user.type(screen.getByLabelText('Password'), 'correct horse');
    await user.click(screen.getByRole('button', { name: 'Sign in' }));

    expect(await screen.findByText('Secret log page')).toBeInTheDocument();
  });

  it('lets a signed-in person straight through', async () => {
    renderApp('/log');
    expect(await screen.findByText('Secret log page')).toBeInTheDocument();
  });

  it('creates an account with a public display name', async () => {
    signedOut();
    const user = userEvent.setup();
    const { repositories } = renderApp('/login?mode=signup&next=%2Faccount');

    expect(
      await screen.findByRole('heading', { name: 'Create your account' }),
    ).toBeInTheDocument();
    await user.type(screen.getByLabelText('Email'), 'sam@example.com');
    await user.type(screen.getByLabelText('Password'), 'a-good-password');
    await user.type(screen.getByLabelText(/name for your notes/i), 'Sam, dad of 2');
    await user.click(screen.getByRole('button', { name: 'Create account' }));

    expect(await screen.findByRole('heading', { name: 'Account' })).toBeInTheDocument();
    expect(screen.getByText('sam@example.com')).toBeInTheDocument();
    expect(screen.getByText('Sam, dad of 2')).toBeInTheDocument();
    expect((await repositories.auth.getUser())?.displayName).toBe('Sam, dad of 2');
  });

  it('shows why sign-in failed and keeps the form', async () => {
    signedOut();
    const user = userEvent.setup();
    const base = createMockRepositories({ latencyMs: 0 });
    const auth: AuthRepository = {
      ...base.auth,
      getUser: () => Promise.resolve(null),
      onChange: () => () => {},
      signIn: () => Promise.reject(new Error('That email and password don’t match.')),
    };
    renderApp('/login', { ...base, auth });

    await user.type(await screen.findByLabelText('Email'), 'maya@example.com');
    await user.type(screen.getByLabelText('Password'), 'wrong-password');
    await user.click(screen.getByRole('button', { name: 'Sign in' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('don’t match');
    expect(screen.getByLabelText('Email')).toHaveValue('maya@example.com');
  });

  it('asks you to check your email when confirmation is required', async () => {
    const user = userEvent.setup();
    const base = createMockRepositories({ latencyMs: 0 });
    const auth: AuthRepository = {
      getUser: () => Promise.resolve(null),
      onChange: () => () => {},
      signIn: () => Promise.resolve(),
      signOut: () => Promise.resolve(),
      signUp: () => Promise.resolve({ needsEmailConfirmation: true }),
    };
    renderApp('/login?mode=signup', { ...base, auth });

    await user.type(await screen.findByLabelText('Email'), 'new@example.com');
    await user.type(screen.getByLabelText('Password'), 'a-good-password');
    await user.click(screen.getByRole('button', { name: 'Create account' }));

    expect(
      await screen.findByRole('heading', { name: 'Check your email' }),
    ).toBeInTheDocument();
    expect(screen.getByText('new@example.com')).toBeInTheDocument();
  });

  it('never follows a login redirect that leaves the app', async () => {
    const user = userEvent.setup();
    signedOut();
    renderApp('/login?next=https%3A%2F%2Fevil.example');

    await user.type(await screen.findByLabelText('Email'), 'maya@example.com');
    await user.type(screen.getByLabelText('Password'), 'correct horse');
    await user.click(screen.getByRole('button', { name: 'Sign in' }));

    expect(await screen.findByText('at /')).toBeInTheDocument();
  });

  it('sends a signed-out visitor who taps Save to login, returning to the restaurant', async () => {
    signedOut();
    const user = userEvent.setup();
    const { repositories } = renderApp('/restaurants/r-duane-dough');

    await waitFor(async () => expect(await repositories.auth.getUser()).toBeNull());
    await user.click(await screen.findByRole('button', { name: 'Save' }));

    expect(await screen.findByRole('heading', { name: 'Sign in' })).toBeInTheDocument();
    await user.type(screen.getByLabelText('Email'), 'maya@example.com');
    await user.type(screen.getByLabelText('Password'), 'correct horse');
    await user.click(screen.getByRole('button', { name: 'Sign in' }));

    // Back on the restaurant page, where Save now works.
    await user.click(await screen.findByRole('button', { name: 'Save' }));
    await waitFor(async () =>
      expect((await repositories.savedPlaces.get('r-duane-dough'))?.status).toBe(
        'want_to_try',
      ),
    );
  });

  it('signs out from the account page', async () => {
    const user = userEvent.setup();
    const { repositories } = renderApp('/account');

    await user.click(await screen.findByRole('button', { name: 'Sign out' }));

    expect(await screen.findByText('at /')).toBeInTheDocument();
    expect(await repositories.auth.getUser()).toBeNull();
  });
});
