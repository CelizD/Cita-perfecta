import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../../environments/environment';

let sharedClient: SupabaseClient | null | undefined;

export function isSupabaseConfigured(): boolean {
  const url = environment.supabase.url;
  const anonKey = environment.supabase.anonKey;

  if (!url || !anonKey || url === 'TU_URL_AQUI' || anonKey === 'TU_ANON_KEY_AQUI') {
    return false;
  }

  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

export function getSupabaseClient(): SupabaseClient | null {
  if (!isSupabaseConfigured()) return null;

  if (sharedClient === undefined) {
    sharedClient = createClient(environment.supabase.url, environment.supabase.anonKey, {
      auth: {
        autoRefreshToken: true,
        detectSessionInUrl: true,
        persistSession: true,
        storageKey: `cp-${new URL(environment.supabase.url).host}-auth-token`
      }
    });
  }

  return sharedClient;
}
