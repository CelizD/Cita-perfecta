import { AsyncPipe } from '@angular/common';
import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { RouterLink } from '@angular/router';
import { Observable } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';
import { ChatService } from '../../core/services/chat.service';
import { CompatibilityService } from '../../core/services/compatibility.service';
import { ExternalDatePlan, ExternalDatePlanService } from '../../core/services/external-date-plan.service';
import { MatchService } from '../../core/services/match.service';
import { PublicProfile } from '../../core/models/user.model';
import { DailyTipComponent } from '../../shared/components/daily-tip/daily-tip.component';
import { ProfileCardComponent } from '../../shared/profile-card/profile-card.component';

@Component({
  selector: 'app-welcome',
  standalone: true,
  imports: [AsyncPipe, RouterLink, DailyTipComponent, ProfileCardComponent],
  templateUrl: './welcome.component.html',
  styleUrl: './welcome.component.scss'
})
export class WelcomeComponent {
  actionMessage = '';
  datePlan$: Observable<ExternalDatePlan>;

  constructor(
    public authService: AuthService,
    private compatibilityService: CompatibilityService,
    private matchService: MatchService,
    private chatService: ChatService,
    private externalDatePlanService: ExternalDatePlanService,
    private router: Router
  ) {
    this.datePlan$ = this.externalDatePlanService.getTijuanaPlan();
  }

  get feedProfiles(): PublicProfile[] {
    return this.compatibilityService.getRecommendedProfiles().slice(0, 6);
  }

  get userName(): string {
    return this.authService.currentUser()?.name?.split(' ')[0] ?? 'tu';
  }

  onView(profile: PublicProfile): void {
    if (!this.authService.currentUser()) {
      this.router.navigate(['/login']);
      return;
    }

    this.router.navigate(['/perfil', profile.id]);
  }

  onLike(profile: PublicProfile): void {
    if (!this.authService.currentUser()) {
      this.router.navigate(['/login']);
      return;
    }

    const match = this.matchService.sendLike(profile.id, profile.name, profile.compatibility ?? 80, 'Me gusto tu perfil.');
    const chat = this.chatService.createChatForMatch(match);
    this.actionMessage = `Like enviado a ${profile.name}. Se creo un chat para continuar.`;
    setTimeout(() => this.router.navigate(['/chat', chat.id]), 700);
  }

  onLetter(profile: PublicProfile): void {
    if (!this.authService.currentUser()) {
      this.router.navigate(['/login']);
      return;
    }

    this.matchService.sendLetter(
      profile.id,
      `Hola ${profile.name}, me llamo la atencion tu perfil y me gustaria conocerte con calma y respeto.`
    );
    this.actionMessage = `Carta de conexion enviada a ${profile.name}.`;
  }
}
