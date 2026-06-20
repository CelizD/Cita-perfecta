import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CompatibleProfile, CompatibilityService } from '../../core/services/compatibility.service';
import { SupabaseService } from '../../services/supabase.service';

@Component({
  selector: 'app-explore',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './explore.component.html',
  styleUrl: './explore.component.scss'
})
export class ExploreComponent implements OnInit {
  private supabase = inject(SupabaseService);
  private compatibilityService = inject(CompatibilityService);
  private fb = inject(FormBuilder);
  private router = inject(Router);

  userId = '';
  profiles: CompatibleProfile[] = [];
  loading = false;
  errorMessage = '';
  actionMessage = '';

  commentForm = this.fb.nonNullable.group({
    comment: ['']
  });

  async ngOnInit(): Promise<void> {
    await this.loadProfiles();
  }

  async loadProfiles(): Promise<void> {
    this.loading = true;
    this.errorMessage = '';

    const user = await this.supabase.getCurrentUser();
    if (!user) {
      await this.router.navigate(['/login']);
      return;
    }

    this.userId = user.id;

    try {
      this.profiles = await this.compatibilityService.getCompatibleProfiles(this.userId, 20);
    } catch (error) {
      this.errorMessage = error instanceof Error ? error.message : 'No se pudieron cargar los perfiles.';
    } finally {
      this.loading = false;
    }
  }

  async sendLike(profile: CompatibleProfile): Promise<void> {
    await this.sendSwipe(profile, 'like');
  }

  async sendPass(profile: CompatibleProfile): Promise<void> {
    await this.sendSwipe(profile, 'pass');
  }

  async sendSwipe(profile: CompatibleProfile, action: 'like' | 'pass'): Promise<void> {
    this.loading = true;
    this.errorMessage = '';
    this.actionMessage = '';

    const comment = action === 'like' ? this.commentForm.controls.comment.value.trim() : '';
    const { error } = await this.supabase.sendSwipe(this.userId, profile.id, action, comment || undefined);

    if (error) {
      this.errorMessage = error.message;
      this.loading = false;
      return;
    }

    if (action === 'like') {
      const mutualLike = await this.supabase.checkMutualLike(this.userId, profile.id);

      if (mutualLike.data) {
        const match = await this.supabase.createMatch(this.userId, profile.id);

        if (match.error) {
          this.errorMessage = match.error.message;
          this.loading = false;
          return;
        }

        await this.supabase.createChat(match.data['id']);
        this.actionMessage = `Hicieron match con ${this.profileName(profile)}.`;
      } else {
        this.actionMessage = `Like enviado a ${this.profileName(profile)}.`;
      }
    } else {
      this.actionMessage = `Pasaste el perfil de ${this.profileName(profile)}.`;
    }

    this.commentForm.reset();
    this.profiles = this.profiles.filter((item) => item.id !== profile.id);
    this.loading = false;
  }

  async blockProfile(profile: CompatibleProfile): Promise<void> {
    const { error } = await this.supabase.blockUser(this.userId, profile.id);

    if (error) {
      this.errorMessage = error.message;
      return;
    }

    this.profiles = this.profiles.filter((item) => item.id !== profile.id);
    this.actionMessage = `Bloqueaste a ${this.profileName(profile)}.`;
  }

  async reportProfile(profile: CompatibleProfile): Promise<void> {
    const reason = window.prompt('Motivo del reporte', 'Comportamiento inapropiado');
    if (!reason) return;

    const { error } = await this.supabase.reportUser(this.userId, profile.id, reason);

    if (error) {
      this.errorMessage = error.message;
      return;
    }

    this.profiles = this.profiles.filter((item) => item.id !== profile.id);
    this.actionMessage = `Reporte enviado sobre ${this.profileName(profile)}.`;
  }

  profileName(profile: CompatibleProfile): string {
    return profile.full_name ?? profile.name ?? profile.email ?? 'Perfil';
  }

  initials(profile: CompatibleProfile): string {
    return this.profileName(profile).slice(0, 2).toUpperCase();
  }
}
