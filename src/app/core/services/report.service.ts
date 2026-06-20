import { Injectable } from '@angular/core';
import { Report } from '../models/report.model';
import { AuthService } from './auth.service';
import { SupabaseService } from './supabase.service';

@Injectable({ providedIn: 'root' })
export class ReportService {
  private reportsKey = 'cp_reports';
  private blockedKey = 'cp_blocked_profiles';

  constructor(
    private authService: AuthService,
    private supabaseService: SupabaseService
  ) {}

  reportProfile(toProfileId: number, reason: string, description: string): void {
    const user = this.authService.currentUser();
    if (!user) return;

    const reports = this.getReports();
    reports.push({
      fromUserId: user.id,
      toProfileId,
      reason,
      description,
      createdAt: new Date().toISOString()
    });
    localStorage.setItem(this.reportsKey, JSON.stringify(reports));
  }

  async reportVulnerability(report: { description?: string | null; steps?: string | null }): Promise<void> {
    const supabase = this.supabaseService.client;
    const user = this.authService.currentUser();

    if (supabase) {
      const { error } = await supabase.from('vulnerability_reports').insert({
        reporter_id: user?.id ?? null,
        description: report.description ?? '',
        steps: report.steps ?? '',
        status: 'open'
      });

      if (error) throw new Error(error.message);
      return;
    }

    const reports = this.getReports();
    reports.push({
      fromUserId: user?.id ?? 'anonymous',
      toProfileId: 0,
      reason: 'security_vulnerability',
      description: `Descripcion: ${report.description ?? ''}\nPasos: ${report.steps ?? ''}`,
      createdAt: new Date().toISOString()
    });
    localStorage.setItem(this.reportsKey, JSON.stringify(reports));
  }

  blockProfile(toProfileId: number): void {
    const blocked = this.getBlockedProfiles();
    if (!blocked.includes(toProfileId)) {
      blocked.push(toProfileId);
    }
    localStorage.setItem(this.blockedKey, JSON.stringify(blocked));
  }

  getBlockedProfiles(): number[] {
    const raw = localStorage.getItem(this.blockedKey);
    return raw ? (JSON.parse(raw) as number[]) : [];
  }

  private getReports(): Report[] {
    const raw = localStorage.getItem(this.reportsKey);
    return raw ? (JSON.parse(raw) as Report[]) : [];
  }
}
