import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { MatchService } from '../../services/match.service';
import { SupabaseService } from '../../services/supabase.service';

interface ChatListItem {
  matchId: string;
  status: string;
  profile: {
    name?: string;
    main_photo_url?: string;
  };
}

@Component({
  selector: 'app-chat-list',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './chat-list.component.html',
  styleUrl: './chat-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ChatListComponent implements OnInit {
  private supabase = inject(SupabaseService);
  private matchService = inject(MatchService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  userId = '';
  chats: ChatListItem[] = [];
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
      const matches = await this.matchService.getMatches(this.userId);
      this.chats = matches.map((match: any) => ({
        matchId: match.id,
        status: match.status,
        profile: match.user_a === this.userId ? match.user_b_profile : match.user_a_profile
      }));
    } catch (error) {
      this.errorMessage = error instanceof Error ? error.message : 'No se pudieron cargar los chats.';
    } finally {
      this.loading = false;
      this.cdr.markForCheck();
    }
  }

  profileName(chat: ChatListItem): string {
    return chat.profile.name ?? 'Match';
  }

  initials(chat: ChatListItem): string {
    return this.profileName(chat).slice(0, 2).toUpperCase();
  }
}
