import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { renderWithProviders } from '@/test/renderWithProviders';
import { DiscoverPage } from './DiscoverPage';

describe('DiscoverPage', () => {
  it('shows a loading state, then the restaurants', async () => {
    renderWithProviders(<DiscoverPage />);
    expect(screen.getByText('Loading restaurants…')).toBeInTheDocument();
    expect(await screen.findByRole('heading', { name: '25 places' })).toBeInTheDocument();
    expect(screen.getAllByRole('article').length).toBe(25);
  });

  it('narrows the list when a quick-filter chip is tapped', async () => {
    const user = userEvent.setup();
    renderWithProviders(<DiscoverPage />);
    await screen.findByRole('heading', { name: '25 places' });

    const chip = within(screen.getByRole('group', { name: 'Quick filters' })).getByRole(
      'button',
      { name: /changing table/i },
    );
    await user.click(chip);

    expect(chip).toHaveAttribute('aria-pressed', 'true');
    await waitFor(() =>
      expect(
        screen.getByRole('heading', { level: 2, name: /^\d+ places?$/ }),
      ).not.toHaveTextContent('25 places'),
    );
  });

  it('shows an empty state with a way out when nothing matches', async () => {
    const user = userEvent.setup();
    renderWithProviders(<DiscoverPage />, { route: '/?q=zzzzzz' });
    expect(await screen.findByText('No places match')).toBeInTheDocument();

    await user.click(screen.getAllByRole('button', { name: 'Clear filters' })[0]!);
    expect(await screen.findByRole('heading', { name: '25 places' })).toBeInTheDocument();
  });

  it('shows an error state with a retry button', async () => {
    renderWithProviders(<DiscoverPage />, { mock: { forceError: true } });
    expect(await screen.findByRole('alert')).toHaveTextContent(
      "We couldn't load restaurants",
    );
    expect(screen.getByRole('button', { name: 'Try again' })).toBeInTheDocument();
  });

  it('opens the filter sheet and applies a filter', async () => {
    const user = userEvent.setup();
    renderWithProviders(<DiscoverPage />);
    await screen.findByRole('heading', { name: '25 places' });

    await user.click(screen.getByRole('button', { name: 'Filters' }));
    const sheet = await screen.findByRole('dialog', { name: 'Filters' });
    await user.click(within(sheet).getByRole('button', { name: /quiet/i }));

    expect(within(sheet).getByRole('button', { name: /quiet/i })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(
      await screen.findByRole('button', { name: 'Filters, 1 selected' }),
    ).toBeInTheDocument();
  });
});
