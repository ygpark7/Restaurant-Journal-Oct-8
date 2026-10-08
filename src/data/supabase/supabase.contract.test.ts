import { createClient } from '@supabase/supabase-js';
import { describe, it } from 'vitest';
import { runRepositoryContract } from '@/data/contract/repositoryContract';
import { createSupabaseRepositories } from './SupabaseRepositories';

/**
 * Opt-in: runs the shared repository contract against a REAL Supabase project.
 * It signs in as brand-new anonymous users and creates visits and saved places, so use a
 * test project (or accept some leftover rows):
 *
 *   SUPABASE_CONTRACT_URL=https://xxx.supabase.co SUPABASE_CONTRACT_KEY=<anon key> npm test
 */
const url = process.env.SUPABASE_CONTRACT_URL;
const key = process.env.SUPABASE_CONTRACT_KEY;

if (url && key) {
  runRepositoryContract('Supabase', () =>
    // persistSession: false -> every factory call is a fresh anonymous user with empty state.
    createSupabaseRepositories(
      createClient(url, key, {
        auth: { persistSession: false, autoRefreshToken: false },
      }),
    ),
  );
} else {
  describe.skip('Repository contract: Supabase', () => {
    it('skipped: set SUPABASE_CONTRACT_URL and SUPABASE_CONTRACT_KEY to run it', () => {});
  });
}
