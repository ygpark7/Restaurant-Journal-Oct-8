import { QueryClient } from '@tanstack/react-query';

export function createQueryClient(options: { retry?: number | false } = {}) {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        retry: options.retry ?? 1,
        retryDelay: 400,
        refetchOnWindowFocus: false,
      },
    },
  });
}
