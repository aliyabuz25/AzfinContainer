import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

let _supabase: SupabaseClient | null = null;
if (supabaseUrl && supabaseAnonKey) {
  console.log('Initializing Supabase client with URL:', supabaseUrl);
  _supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false },
  });
} else {
  console.warn('Supabase credentials are missing; remote features are disabled. Check VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.');
}

export const supabase = _supabase;
export const isSupabaseConfigured = Boolean(_supabase);
