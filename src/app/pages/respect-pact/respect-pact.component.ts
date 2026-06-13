import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-respect-pact',
  standalone: true,
  imports: [],
  templateUrl: './respect-pact.component.html',
  styleUrl: './respect-pact.component.scss'
})
export class RespectPactComponent {
  pactItems = [
    'Seré honesto con mis intenciones.',
    'Trataré a los demás con empatía.',
    'Si ya no quiero seguir, cerraré con respeto.',
    'No acosaré ni presionaré a nadie.',
    'Reportaré comportamientos inapropiados.'
  ];

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  accept(): void {
    this.authService.updateCurrentUser({ pactAccepted: true });
    this.router.navigate(['/onboarding']);
  }
}
