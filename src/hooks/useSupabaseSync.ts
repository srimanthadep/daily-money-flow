// Supabase sync is handled via anon key + user_id column filtering.
// No Clerk JWT integration needed since RLS is not enabled.
export function useSupabaseSync() {
  // No-op: kept for compatibility with existing imports
}
