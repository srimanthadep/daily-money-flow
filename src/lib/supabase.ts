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

export const supabase = createClient(
  supabaseUrl || 'https://placeholder-project.supabase.co', 
  supabaseAnonKey || 'placeholder-key'
);

export { isConfigured };
