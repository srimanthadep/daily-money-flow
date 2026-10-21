import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const isConfigured = !!supabaseUrl && 
                   !!supabaseAnonKey && 
                   supabaseUrl !== 'https://placeholder-project.supabase.co' &&
                   !supabaseAnonKey.includes('your_supabase');

if (!isConfigured) {
  console.warn('Supabase credentials missing or invalid. Cloud sync will be disabled. Please add proper VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your .env file.');
}

/**
 * Returns the current Clerk session token so Supabase can identify the user.
 *
 * Clerk exposes its instance globally as `window.Clerk` once ClerkProvider has
 * mounted. We read the session token here and hand it to Supabase via the
 * `accessToken` option below. This is what makes Row Level Security work:
 * the token's `sub` claim is the Clerk user id, which matches the `user_id`
 * column stored on rows (e.g. in `activity_logs`).
 *
 * Returns null when no user is signed in, in which case RLS will (correctly)
 * deny access to user-scoped rows.
 */
async function getClerkToken(): Promise<string | null> {
  try {
    // @ts-expect-error - Clerk attaches itself to window at runtime
    const clerk = typeof window !== 'undefined' ? window.Clerk : undefined;
    const token = await clerk?.session?.getToken();
    return token ?? null;
  } catch (err) {
    console.warn('Could not retrieve Clerk session token for Supabase:', err);
    return null;
  }
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder-project.supabase.co', 
  supabaseAnonKey || 'placeholder-key',
  {
    // Forward the Clerk session token on every request so Supabase RLS
    // policies can authorize the user via auth.jwt()->>'sub'.
    accessToken: getClerkToken,
  }
);

export { isConfigured };
