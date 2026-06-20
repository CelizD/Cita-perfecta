import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { SupabaseService } from '../../services/supabase.service';

interface MatchView {
  id: string;
  compatibility: number;
  status: string;
  otherProfile: {
    full_name?: string;
    name?: string;
    email?: string;
    city?: string;
    photo_url?: string;
  };
}

@Component({
  selector: 'app-match-list',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './match-list.component.html',
  styleUrl: './match-list.component.scss'
})
export class MatchListComponent implements OnInit {
  private supabase = inject(SupabaseService);
  private router = inject(Router);

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
    const { data, error } = await this.supabase.getMatches(this.userId);
    this.loading = false;

    if (error) {
      this.errorMessage = error.message;
      return;
    }

    this.matches = (data ?? [])
      .filter((match: any) => match.status === 'active')
      .map((match: any) => ({
        id: match.id,
        compatibility: match.compatibility ?? 80,
        status: match.status,
        otherProfile: match.user_a === this.userId ? match.user_b_profile : match.user_a_profile
      }));
  }

  async openChat(match: MatchView): Promise<void> {
    await this.supabase.createChat(match.id);
    await this.router.navigate(['/chat', match.id]);
  }

  profileName(match: MatchView): string {
    return match.otherProfile.full_name ?? match.otherProfile.name ?? match.otherProfile.email ?? 'Match';
  }

  initials(match: MatchView): string {
    return this.profileName(match).slice(0, 2).toUpperCase();
  }
}
