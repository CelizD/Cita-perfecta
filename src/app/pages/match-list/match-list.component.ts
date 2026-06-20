import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { MatchService } from '../../services/match.service';
import { SupabaseService } from '../../services/supabase.service';

interface MatchView {
  id: string;
  compatibility: number;
  status: string;
  otherProfile: {
    name?: string;
    age?: number;
    city?: string;
    main_photo_url?: string;
  };
}

@Component({
  selector: 'app-match-list',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './match-list.component.html',
  styleUrl: './match-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MatchListComponent implements OnInit {
  private supabase = inject(SupabaseService);
  private matchService = inject(MatchService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  userId = '';
  matches: MatchView[] = [];
  loading = false;
  errorMessage = '';

  async ngOnInit(): Promise<void> {
    this.loading = true;
    const user = await this.supabase.getCurrentUser();

    if (!user) {
      await this.router.navigate(['/login']);
      return;
    }

    this.userId = user.id;
    try {
      const data = await this.matchService.getMatches(this.userId);
      this.matches = data
      .map((match: any) => ({
        id: match.id,
        compatibility: match.compatibility ?? 80,
        status: match.status,
        otherProfile: match.user_a === this.userId ? match.user_b_profile : match.user_a_profile
      }));
    } catch (error) {
      this.errorMessage = error instanceof Error ? error.message : 'No se pudieron cargar tus matches.';
    } finally {
      this.loading = false;
      this.cdr.markForCheck();
    }
  }

  async openChat(match: MatchView): Promise<void> {
    await this.supabase.createChat(match.id);
    await this.router.navigate(['/chat', match.id]);
  }

  profileName(match: MatchView): string {
    return match.otherProfile.name ?? 'Match';
  }

  initials(match: MatchView): string {
    return this.profileName(match).slice(0, 2).toUpperCase();
  }
}
