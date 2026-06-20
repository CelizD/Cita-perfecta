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
    'Sere honesto con mis intenciones.',
    'Tratare a los demas con empatia.',
    'Si ya no quiero seguir, intentare cerrar con respeto.',
    'No acosare, manipulare ni presionare a nadie.',
    'Cuidare mi seguridad y la de los demas.'
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
