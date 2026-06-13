import { Injectable } from '@angular/core';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class UserService {
  readonly interests = [
    'Música',
    'Café',
    'Cine',
    'Viajes',
    'Tecnología',
    'Mascotas',
    'Lectura',
    'Gym',
    'Familia',
    'Arte',
    'Videojuegos',
    'Cocina'
  ];

  constructor(private authService: AuthService) {}

  saveProfile(data: { city: string; bio: string; interests: string[]; photoProfile?: string }): void {
    this.authService.updateCurrentUser({
      city: data.city,
      bio: data.bio,
      interests: data.interests,
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
