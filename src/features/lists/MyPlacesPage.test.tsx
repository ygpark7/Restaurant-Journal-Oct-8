import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { createMockRepositories } from '@/data/mock/MockRepositories';
import { renderWithProviders } from '@/test/renderWithProviders';
import { MyPlacesPage } from './MyPlacesPage';

async function seedRepositories() {
  const repositories = createMockRepositories({ latencyMs: 0 });
  await repositories.savedPlaces.save('r-olive-ember', 'want_to_try');
  await repositories.savedPlaces.save('r-duane-dough', 'want_to_try');
  await repositories.savedPlaces.save('r-little-sprout', 'been_there');
  return repositories;
}

describe('MyPlacesPage', () => {
  it('shows an empty state per tab when nothing is saved', async () => {
    const user = userEvent.setup();
    renderWithProviders(<MyPlacesPage />);
    expect(await screen.findByText('Nothing saved yet')).toBeInTheDocument();

    await user.click(screen.getByRole('tab', { name: /been there/i }));
    expect(await screen.findByText('No visits logged yet')).toBeInTheDocument();
  });

  it('splits saved places across the two tabs, with counts', async () => {
    const user = userEvent.setup();
    renderWithProviders(<MyPlacesPage />, { repositories: await seedRepositories() });

    expect(
      await screen.findByRole('tab', { name: /want to try \(2\)/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /been there \(1\)/i })).toBeInTheDocument();
    expect(screen.getByText('Olive & Ember')).toBeInTheDocument();
    expect(screen.queryByText('Little Sprout Pizzeria')).not.toBeInTheDocument();

    await user.click(screen.getByRole('tab', { name: /been there/i }));
    expect(await screen.findByText('Little Sprout Pizzeria')).toBeInTheDocument();
  });

  it('removes a place from the list', async () => {
    const user = userEvent.setup();
    const repositories = await seedRepositories();
    renderWithProviders(<MyPlacesPage />, { repositories });

    await user.click(
      await screen.findByRole('button', {
        name: 'Remove Olive & Ember from Want to try',
      }),
    );

    expect(
      await screen.findByRole('tab', { name: /want to try \(1\)/i }),
    ).toBeInTheDocument();
    expect(screen.queryByText('Olive & Ember')).not.toBeInTheDocument();
    expect(await repositories.savedPlaces.get('r-olive-ember')).toBeNull();
  });

  it('links each place to its detail page', async () => {
    renderWithProviders(<MyPlacesPage />, { repositories: await seedRepositories() });
    const row = (await screen.findByText('Duane Dough')).closest('li')!;
    expect(within(row).getByRole('link')).toHaveAttribute(
      'href',
      '/restaurants/r-duane-dough',
    );
  });
});
