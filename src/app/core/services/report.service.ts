// H-006: reportProfile y blockProfile ahora persisten en Supabase, no en localStorage.
//         Los IDs son uuid (string), no number.
import { Injectable } from '@angular/core';
import { AuthService } from './auth.service';
import { SupabaseService } from './supabase.service';

@Injectable({ providedIn: 'root' })
export class ReportService {
  constructor(
    private authService: AuthService,
    private supabaseService: SupabaseService
  ) {}

  async reportProfile(toProfileId: string, reason: string, description = ''): Promise<void> {
    const supabase = this.supabaseService.client;
    const user = this.authService.currentUser();
    if (!supabase || !user) return;

    const { error } = await supabase.from('reports').insert({
      reporter_id: user.id,
      reported_user_id: toProfileId,
      reason,
      description: description || null,
      status: 'pending'
    });

    if (error) throw new Error(error.message);
  }

  async blockProfile(toProfileId: string): Promise<void> {
    const supabase = this.supabaseService.client;
    const user = this.authService.currentUser();
    if (!supabase || !user) return;

    const { error } = await supabase
      .from('blocks')
      .upsert({ blocker_id: user.id, blocked_user_id: toProfileId }, { onConflict: 'blocker_id,blocked_user_id' });

    if (error) throw new Error(error.message);
  }

  async reportVulnerability(report: { description?: string | null; steps?: string | null }): Promise<void> {
    const supabase = this.supabaseService.client;
    if (!supabase) throw new Error(this.supabaseService.requiredConfigMessage);

    const user = this.authService.currentUser();

    const { error } = await supabase.from('vulnerability_reports').insert({
      reporter_id: user?.id ?? null,
      description: report.description ?? '',
      steps: report.steps ?? '',
      status: 'open'
    });

    if (error) throw new Error(error.message);
  }
}
