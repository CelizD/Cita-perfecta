import { Injectable } from '@angular/core';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class PremiumService {
  benefits = [
    'Ver mas perfiles compatibles por dia',
    'Enviar mas cartas de conexion',
    'Acceder a icebreakers premium',
    'Modo pausa avanzado',
    'Sugerencias de compatibilidad mas detalladas',
    'Mas privacidad y control sobre tu experiencia'
  ];

  constructor(private authService: AuthService) {}

  activatePremium(): void {
    this.authService.updateCurrentUser({ premium: true });
  }
}
