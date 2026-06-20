import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { FormBuilder, FormControl, FormRecord, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { WeatherData, WeatherService } from '../../core/services/weather.service';
import { MatchService } from '../../services/match.service';
import { ExploreProfile, ProfileService } from '../../services/profile.service';
import { SupabaseService } from '../../services/supabase.service';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';

@Component({
  selector: 'app-explore',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, EmptyStateComponent],
  templateUrl: './explore.component.html',
  styleUrl: './explore.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ExploreComponent implements OnInit {
  private supabase = inject(SupabaseService);
  private profileService = inject(ProfileService);
  private matchService = inject(MatchService);
  private weatherService = inject(WeatherService);
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  userId = '';
  page = 0;
  profiles: ExploreProfile[] = [];
  loading = false;
  errorMessage = '';
  actionMessage = '';
  matchMessage = '';
  weather: WeatherData | null = null;

  commentForm = new FormRecord<FormControl<string>>({});

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
      const [profiles] = await Promise.all([
        this.profileService.getExploreProfiles(this.userId, this.page),
        this.loadWeather(user)
      ]);
      this.profiles = profiles;
      this.syncCommentControls();
    } catch (error) {
      this.errorMessage = error instanceof Error ? error.message : 'No se pudieron cargar los perfiles.';
    } finally {
      this.loading = false;
      this.cdr.markForCheck();
    }
  }

  async nextPage(): Promise<void> {
    this.page += 1;
    await this.loadProfiles();
  }

  async sendLike(profile: ExploreProfile): Promise<void> {
    this.loading = true;
    this.clearMessages();

    try {
      const comment = this.commentControl(profile).value.trim();
      const result = await this.matchService.sendLike(this.userId, profile.user_id, comment || undefined);
      this.removeProfile(profile);

      if (result.matched && result.matchId) {
        this.matchMessage = `Es un match con ${this.profileName(profile)}.`;
        setTimeout(() => void this.router.navigate(['/chat', result.matchId]), 900);
      } else {
        this.actionMessage = `Like enviado a ${this.profileName(profile)}.`;
      }
    } catch (error) {
      this.errorMessage = error instanceof Error ? error.message : 'No se pudo enviar el like.';
    } finally {
      this.loading = false;
      this.cdr.markForCheck();
    }
  }

  async sendPass(profile: ExploreProfile): Promise<void> {
    this.loading = true;
    this.clearMessages();

    try {
      await this.matchService.sendPass(this.userId, profile.user_id);
      this.removeProfile(profile);
      this.actionMessage = `Pasaste el perfil de ${this.profileName(profile)}.`;
    } catch (error) {
      this.errorMessage = error instanceof Error ? error.message : 'No se pudo guardar el pass.';
    } finally {
      this.loading = false;
      this.cdr.markForCheck();
    }
  }

  commentControl(profile: ExploreProfile): FormControl<string> {
    return this.commentForm.controls[profile.user_id];
  }

  profileName(profile: ExploreProfile): string {
    return profile.name || 'Perfil';
  }

  initials(profile: ExploreProfile): string {
    return this.profileName(profile).slice(0, 2).toUpperCase();
  }

  private async loadWeather(user: { user_metadata?: Record<string, unknown> }): Promise<void> {
    const city = String(user.user_metadata?.['city'] ?? '');
    if (!city) return;
    this.weather = await this.weatherService.getWeatherForCity(city);
  }

  private syncCommentControls(): void {
    for (const profile of this.profiles) {
      if (!this.commentForm.controls[profile.user_id]) {
        this.commentForm.addControl(profile.user_id, this.fb.nonNullable.control(''));
      }
    }
  }

  private removeProfile(profile: ExploreProfile): void {
    this.profiles = this.profiles.filter((item) => item.id !== profile.id);
    this.commentForm.removeControl(profile.user_id);
  }

  private clearMessages(): void {
    this.errorMessage = '';
    this.actionMessage = '';
    this.matchMessage = '';
  }
}
