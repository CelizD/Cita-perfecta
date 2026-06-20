import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class SupabaseService {
  readonly isConfigured = Boolean(
    environment.supabase.url &&
      environment.supabase.anonKey &&
      environment.supabase.url !== 'TU_URL_AQUI' &&
      environment.supabase.anonKey !== 'TU_ANON_KEY_AQUI'
  );
  readonly client: SupabaseClient | null = this.isConfigured
    ? createClient(environment.supabase.url, environment.supabase.anonKey, {
        auth: {
          autoRefreshToken: true,
          detectSessionInUrl: true,
          persistSession: true
        }
      })
    : null;

  get requiredConfigMessage(): string {
    return 'Falta configurar Supabase. Pega environment.supabase.url y environment.supabase.anonKey en src/environments/environment.ts.';
  }
}
