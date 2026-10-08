import { createClient } from '@supabase/supabase-js';
import { describe, it } from 'vitest';
import { runRepositoryContract } from '@/data/contract/repositoryContract';
import { createSupabaseRepositories } from './SupabaseRepositories';

/**
 * Opt-in: runs the shared repository contract against a REAL Supabase project.
 *
 * Each test signs up a brand-new throwaway user (so every test starts with empty saved places),
 * which means this leaves test users, visits, and saved places behind: use a test project.
 * It needs "Confirm email" turned OFF (Authentication -> Sign In / Providers -> Email),
 * otherwise sign-up returns no session.
 *
 *   SUPABASE_CONTRACT_URL=https://xxx.supabase.co SUPABASE_CONTRACT_KEY=<anon key> npm test
 */
const url = process.env.SUPABASE_CONTRACT_URL;
const key = process.env.SUPABASE_CONTRACT_KEY;

if (url && key) {
  runRepositoryContract('Supabase', async () => {
    // persistSession: false keeps each test's user isolated from the others.
    const client = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const repos = createSupabaseRepositories(client);
    const { needsEmailConfirmation } = await repos.auth.signUp({
      email: `contract-${crypto.randomUUID()}@example.com`,
      password: `Pw-${crypto.randomUUID()}`,
    });
    if (needsEmailConfirmation) {
      throw new Error('Turn off "Confirm email" in Supabase to run the contract tests.');
    }
    return repos;
  });
} else {
  describe.skip('Repository contract: Supabase', () => {
    it('skipped: set SUPABASE_CONTRACT_URL and SUPABASE_CONTRACT_KEY to run it', () => {});
  });
}
