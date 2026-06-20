import { Injectable } from '@angular/core';
import { SupabaseClient } from '@supabase/supabase-js';
import { getSupabaseClient, isSupabaseConfigured } from './supabase-client';

@Injectable({ providedIn: 'root' })
export class SupabaseService {
  readonly isConfigured = isSupabaseConfigured();
  readonly client: SupabaseClient | null = getSupabaseClient();

  get requiredConfigMessage(): string {
    return 'Falta configurar Supabase. Pega environment.supabase.url y environment.supabase.anonKey en src/environments/environment.ts.';
  }
}
