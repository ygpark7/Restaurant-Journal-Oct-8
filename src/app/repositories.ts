/**
 * ★ THE COMPOSITION FILE ★
 *
 * This is the only non-test file allowed to import a repository implementation
 * (an ESLint rule enforces it). To move to Supabase, build `createSupabaseRepositories()`
 * and return it from `createAppRepositories()` here. No component changes needed.
 */
import { createMockRepositories } from '@/data/mock/MockRepositories';
import type { MockOptions } from '@/data/mock/latency';
import type { Repositories } from '@/domain/repositories';

/**
 * Dev switches for seeing loading/error states on demand:
 *   ?mock=slow   -> ~2.5s latency
 *   ?mock=error  -> every request fails
 *   ?mock=flaky  -> half of requests fail
 * Read once at startup; reload without the param to reset.
 * Also: VITE_MOCK_LATENCY_MS=0 (e.g. in .env.local) for instant responses.
 */
function mockOptionsFromEnvironment(): MockOptions {
  const envLatency = import.meta.env.VITE_MOCK_LATENCY_MS;
  const options: MockOptions =
    envLatency !== undefined && envLatency !== ''
      ? { latencyMs: Number(envLatency) }
      : {};

  switch (new URLSearchParams(window.location.search).get('mock')) {
    case 'slow':
      return { ...options, latencyMs: 2500 };
    case 'error':
      return { ...options, forceError: true };
    case 'flaky':
      return { ...options, failureRate: 0.5 };
    default:
      return options;
  }
}

export function createAppRepositories(): Repositories {
  return createMockRepositories(mockOptionsFromEnvironment());
}
