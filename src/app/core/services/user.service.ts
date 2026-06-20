import { Injectable } from '@angular/core';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class UserService {
  readonly interests = [
    'Musica',
    'Cafe',
    'Cine',
    'Viajes',
    'Tecnologia',
    'Mascotas',
    'Lectura',
    'Gym',
    'Familia',
    'Arte',
    'Videojuegos',
    'Cocina'
  ];

  readonly communicationStyles = [
    'Directo y claro',
    'Tranquilo y reflexivo',
    'Expresivo y emocional',
    'Practico y breve'
  ];

  readonly loveLanguages = [
    'Tiempo de calidad',
    'Palabras de afirmacion',
    'Actos de servicio',
    'Detalles significativos',
    'Contacto fisico con respeto'
  ];

  readonly dealbreakers = [
    'Falta de respeto',
    'Presion o manipulacion',
    'Ghosting constante',
    'Planes sin honestidad',
    'Relaciones sin claridad'
  ];

  constructor(private authService: AuthService) {}

  saveProfile(data: {
    city: string;
    bio: string;
    interests: string[];
    communicationStyle: string;
    loveLanguage: string;
    dealbreakers: string[];
    photoProfile?: string;
  }): void {
    this.authService.updateCurrentUser({
      city: data.city,
      bio: data.bio,
      interests: data.interests,
      communicationStyle: data.communicationStyle,
      loveLanguage: data.loveLanguage,
      dealbreakers: data.dealbreakers,
      photoProfile: data.photoProfile,
      profileComplete: true
    });
  }

  togglePauseMode(): void {
    const user = this.authService.currentUser();
    if (!user) return;
    this.authService.updateCurrentUser({ pauseMode: !user.pauseMode });
  }
}
