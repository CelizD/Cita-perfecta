import { Injectable } from '@angular/core';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class PremiumService {
  benefits = [
    'Ver más perfiles compatibles por día',
    'Enviar más cartas de conexión',
    'Acceder a icebreakers premium',
    'Modo pausa avanzado',
    'Sugerencias de compatibilidad más detalladas'
  ];

  constructor(private authService: AuthService) {}

  activatePremium(): void {
    this.authService.updateCurrentUser({ premium: true });
  }
}
