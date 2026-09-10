import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '';
const supabaseKey = 
  process.env.SUPABASE_SERVICE_ROLE_KEY || 
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 
  process.env.SUPABASE_ANON_KEY || 
  '';

export const isSupabaseServerConfigured = Boolean(
  supabaseUrl && 
  supabaseKey && 
  !supabaseUrl.includes('your-project') && 
  !supabaseUrl.includes('placeholder')
);

let serverClient: SupabaseClient | null = null;

export function getSupabaseServerClient(): SupabaseClient | null {
  if (!isSupabaseServerConfigured) return null;
  if (!serverClient) {
    serverClient = createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
  }
  return serverClient;
}
