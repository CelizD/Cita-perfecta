import { Injectable } from '@angular/core';
import { PublicProfile } from '../models/user.model';
import { BaseStorageRepository } from '../classes/base-storage.repository';

export type ProfileCreateData = Omit<PublicProfile, 'id' | 'compatibility' | 'answers'>;

@Injectable({ providedIn: 'root' })
export class ProfileCrudService extends BaseStorageRepository<PublicProfile> {
  constructor() {
    super('cp_crud_profiles', [
      {
        id: 501,
        name: 'Valeria',
        age: 23,
        city: 'Tijuana',
        bio: 'Me gustan los planes tranquilos, el café y las conexiones honestas.',
        interests: ['Café', 'Música', 'Cine'],
        traits: ['Honestidad', 'Calma', 'Empatía'],
        answers: [5, 5, 4, 4, 5, 5, 5, 4, 5, 5],
        compatibility: 91
      }
    ]);
  }

  getProfiles(): PublicProfile[] {
    return this.readAll();
  }

  getProfileById(id: number): PublicProfile | undefined {
    return this.readById(id);
  }

  createProfile(data: ProfileCreateData): PublicProfile {
    return this.createItem({
      ...data,
      compatibility: 80,
      answers: [4, 4, 4, 4, 4, 4, 4, 4, 4, 4]
    });
  }

  updateProfile(id: number, changes: Partial<PublicProfile>): PublicProfile | undefined {
    return this.updateItem(id, changes);
  }

  deleteProfile(id: number): void {
    this.deleteItem(id);
  }
}
