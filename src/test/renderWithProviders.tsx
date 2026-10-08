import { render } from '@testing-library/react';
import { QueryClientProvider } from '@tanstack/react-query';
import type { ReactElement } from 'react';
import { MemoryRouter } from 'react-router';
import { createMockRepositories } from '@/data/mock/MockRepositories';
import type { MockOptions } from '@/data/mock/latency';
import type { Repositories } from '@/domain/repositories';
import { ToastProvider } from '@/components/Toast';
import { createQueryClient } from '@/lib/queryClient';
import { RepositoriesProvider } from '@/lib/repositories-context';

/** Renders with a fresh query cache, instant mock repositories, and a MemoryRouter. */
export function renderWithProviders(
  ui: ReactElement,
  options: { route?: string; repositories?: Repositories; mock?: MockOptions } = {},
) {
  const repositories =
    options.repositories ?? createMockRepositories({ latencyMs: 0, ...options.mock });
  const queryClient = createQueryClient({ retry: false });
  return {
    repositories,
    ...render(
      <RepositoriesProvider repositories={repositories}>
        <QueryClientProvider client={queryClient}>
          <ToastProvider>
            <MemoryRouter initialEntries={[options.route ?? '/']}>{ui}</MemoryRouter>
          </ToastProvider>
        </QueryClientProvider>
      </RepositoriesProvider>,
    ),
  };
}
