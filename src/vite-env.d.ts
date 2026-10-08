/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Your Supabase project URL. When this and the key are set, the app uses Supabase. */
  readonly VITE_SUPABASE_URL?: string;
  /** The project's public anon/publishable key. Never put the service-role key here. */
  readonly VITE_SUPABASE_ANON_KEY?: string;
  /** Mock data layer only: fixed latency in ms (0 for instant). */
  readonly VITE_MOCK_LATENCY_MS?: string;
}
