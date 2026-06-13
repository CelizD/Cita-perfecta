import { Injectable } from '@angular/core';
import { UserProfile } from '../models/user-profile.model';

@Injectable({
  providedIn: 'root'
})
export class ProfileCrudService {
  private storageKey = 'cita_perfecta_profiles';

  private defaultProfiles: UserProfile[] = [
    {
      id: '1',
      name: 'Ana',
      age: 22,
      city: 'Tijuana',
      bio: 'Me gusta el café, la música y las conversaciones tranquilas.',
      interests: ['Café', 'Música', 'Cine'],
      compatibility: 87
    },
    {
      id: '2',
      name: 'Luis',
      age: 24,
      city: 'Tijuana',
      bio: 'Me gusta la tecnología, viajar y aprender cosas nuevas.',
      interests: ['Tecnología', 'Viajes'],
      compatibility: 81
    }
  ];

  getProfiles(): UserProfile[] {
    const data = localStorage.getItem(this.storageKey);

    if (!data) {
      localStorage.setItem(this.storageKey, JSON.stringify(this.defaultProfiles));
      return this.defaultProfiles;
    }

    return JSON.parse(data);
  }

  createProfile(profile: UserProfile): void {
    const profiles = this.getProfiles();
    profiles.push(profile);
    this.save(profiles);
  }

  updateProfile(updatedProfile: UserProfile): void {
    const profiles = this.getProfiles().map(profile =>
      profile.id === updatedProfile.id ? updatedProfile : profile
    );

    this.save(profiles);
  }

  deleteProfile(id: string): void {
    const profiles = this.getProfiles().filter(profile => profile.id !== id);
    this.save(profiles);
  }

  private save(profiles: UserProfile[]): void {
    localStorage.setItem(this.storageKey, JSON.stringify(profiles));
  }
}