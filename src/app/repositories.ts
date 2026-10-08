/**
 * ★ THE COMPOSITION FILE ★
 *
 * This is the only non-test file allowed to import a repository implementation
 * (an ESLint rule enforces it). Components only ever see the interfaces in src/domain.
 *
 * Which implementation runs:
 *   - Supabase, when VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set (see .env.example)
 *   - the in-browser mock otherwise (also forced with ?data=mock)
 */
import { createClient } from '@supabase/supabase-js';
import { createMockRepositories } from '@/data/mock/MockRepositories';
import type { MockOptions } from '@/data/mock/latency';
import { createSupabaseRepositories } from '@/data/supabase/SupabaseRepositories';
import type { Repositories } from '@/domain/repositories';

/**
 * Mock-only dev switches for seeing loading/error states on demand:
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
  const url = import.meta.env.VITE_SUPABASE_URL;
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  const forceMock = new URLSearchParams(window.location.search).get('data') === 'mock';

  if (url && anonKey && !forceMock) {
    console.info('[data] Using Supabase');
    return createSupabaseRepositories(createClient(url, anonKey));
  }

  if (url && !anonKey) {
    console.warn(
      '[data] VITE_SUPABASE_URL is set but VITE_SUPABASE_ANON_KEY is missing, so the app is using ' +
        'the mock data. Add the key to .env.local and restart the dev server.',
    );
  } else {
    console.info('[data] Using the in-browser mock data');
  }
  return createMockRepositories(mockOptionsFromEnvironment());
}
