import { Injectable, inject } from '@angular/core';
import { SupabaseService } from './supabase.service';

@Injectable({ providedIn: 'root' })
export class ConsentService {
  private supabaseService = inject(SupabaseService);

  async acceptTerms(userId: string, version = '1.0') {
    return this.updateProfile(userId, {
      terms_accepted_at: new Date().toISOString(),
      terms_version: version,
      data_consent_given: true,
      data_consent_at: new Date().toISOString()
    });
  }

  async acceptPrivacy(userId: string, version = '1.0') {
    return this.updateProfile(userId, {
      privacy_accepted_at: new Date().toISOString(),
      privacy_version: version
    });
  }

  async hasConsent(userId: string): Promise<boolean> {
    const supabase = this.supabaseService.client;
    if (!supabase) return false;

    const { data } = await supabase
      .from('profiles')
      .select('data_consent_given')
      .eq('id', userId)
      .maybeSingle();

    return Boolean(data?.['data_consent_given']);
  }

  private updateProfile(userId: string, data: Record<string, unknown>) {
    const supabase = this.supabaseService.client;
    if (!supabase) {
      return Promise.resolve({
        data: null,
        error: { message: this.supabaseService.requiredConfigMessage }
      });
    }

    return supabase.from('profiles').update(data).eq('id', userId).select().single();
  }
}
