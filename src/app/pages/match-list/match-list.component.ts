import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { ProfileCardComponent } from '../../shared/profile-card/profile-card.component';
import { CompatibilityService } from '../../core/services/compatibility.service';
import { ReportService } from '../../core/services/report.service';
import { MatchService } from '../../core/services/match.service';
import { ChatService } from '../../core/services/chat.service';
import { PublicProfile } from '../../core/models/user.model';

@Component({
  selector: 'app-match-list',
  standalone: true,
  imports: [ProfileCardComponent],
  templateUrl: './match-list.component.html',
  styleUrl: './match-list.component.scss'
})
export class MatchListComponent {
  actionMessage = '';

  constructor(
    private compatibilityService: CompatibilityService,
    private reportService: ReportService,
    private matchService: MatchService,
    private chatService: ChatService,
    private router: Router
  ) {}

  get profiles(): PublicProfile[] {
    const blocked = this.reportService.getBlockedProfiles();
    return this.compatibilityService.getRecommendedProfiles().filter((profile) => !blocked.includes(profile.id));
  }

  onLike(profile: PublicProfile): void {
    const match = this.matchService.sendLike(profile.id, profile.name, profile.compatibility ?? 80, 'Me gusto tu perfil.');
    const chat = this.chatService.createChatForMatch(match);
    this.actionMessage = `Like enviado a ${profile.name}. Se creo un match local.`;
    setTimeout(() => this.router.navigate(['/chat', chat.id]), 700);
  }

  onView(profile: PublicProfile): void {
    this.router.navigate(['/perfil', profile.id]);
  }

  onLetter(profile: PublicProfile): void {
    this.matchService.sendLetter(
      profile.id,
      `Hola ${profile.name}, me llamo la atencion tu perfil y me gustaria conocerte con calma y respeto.`
    );
    this.actionMessage = `Carta de conexion enviada a ${profile.name}.`;
  }
}
