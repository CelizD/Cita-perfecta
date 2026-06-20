import { Injectable } from '@angular/core';

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

  // H-001: premium se otorga desde el servidor (webhook de pago via RPC activate_premium).
  // El cliente no puede activar premium directamente; la BD bloquea el intento via trigger.
  isPremiumActive(premium: boolean): boolean {
    return premium;
  }
}
