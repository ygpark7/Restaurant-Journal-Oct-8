import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { renderWithProviders } from '@/test/renderWithProviders';
import { ShareButton } from './ShareButton';

const props = {
  title: 'Olive & Ember',
  text: 'A nice spot',
  path: '/restaurants/r-olive-ember',
};

afterEach(() => {
  Reflect.deleteProperty(navigator, 'share');
  vi.restoreAllMocks();
});

describe('ShareButton', () => {
  it('uses the Web Share API when the browser has it', async () => {
    const share = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'share', { value: share, configurable: true });
    const user = userEvent.setup();
    renderWithProviders(<ShareButton {...props} />);

    await user.click(screen.getByRole('button', { name: 'Share' }));

    expect(share).toHaveBeenCalledWith({
      title: 'Olive & Ember',
      text: 'A nice spot',
      url: `${window.location.origin}/restaurants/r-olive-ember`,
    });
  });

  it('falls back to copying the link and says so', async () => {
    const user = userEvent.setup();
    renderWithProviders(<ShareButton {...props} />);

    await user.click(screen.getByRole('button', { name: 'Share' }));

    expect(await screen.findByText('Link copied')).toBeInTheDocument();
    expect(await navigator.clipboard.readText()).toBe(
      `${window.location.origin}/restaurants/r-olive-ember`,
    );
  });

  it('does nothing noisy when the person closes the share sheet', async () => {
    const abort = new DOMException('closed', 'AbortError');
    Object.defineProperty(navigator, 'share', {
      value: vi.fn().mockRejectedValue(abort),
      configurable: true,
    });
    const user = userEvent.setup();
    renderWithProviders(<ShareButton {...props} />);

    await user.click(screen.getByRole('button', { name: 'Share' }));

    expect(screen.queryByText('Link copied')).not.toBeInTheDocument();
  });
});
