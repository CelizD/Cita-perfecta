import { Injectable } from '@angular/core';
import { PublicProfile } from '../models/user.model';
import { BaseStorageRepository } from '../classes/base-storage.repository';

export type ProfileCreateData = Omit<PublicProfile, 'id' | 'compatibility' | 'answers'>;

const DEFAULT_PROFILES: PublicProfile[] = [
  {
    id: 501,
    name: 'Valeria',
    age: 23,
    city: 'Tijuana',
    bio: 'Me gustan los planes tranquilos, el caf\u00e9 y las conexiones honestas.',
    interests: ['Caf\u00e9', 'M\u00fasica', 'Cine'],
    traits: ['Honestidad', 'Calma', 'Empat\u00eda'],
    answers: [5, 5, 4, 4, 5, 5, 5, 4, 5, 5],
    compatibility: 91
  },
  {
    id: 502,
    name: 'Sofia',
    age: 24,
    city: 'Ensenada',
    bio: 'Disfruto caminar por la playa, cocinar y tener conversaciones tranquilas.',
    interests: ['Playa', 'Cocina', 'Lectura'],
    traits: ['Paciencia', 'Humor', 'Lealtad'],
    answers: [5, 4, 5, 4, 5, 4, 5, 3, 5, 5],
    compatibility: 88
  },
  {
    id: 503,
    name: 'Camila',
    age: 22,
    city: 'Mexicali',
    bio: 'Me gusta la musica en vivo, los cafes bonitos y aprender cosas nuevas.',
    interests: ['M\u00fasica', 'Caf\u00e9', 'Arte'],
    traits: ['Creatividad', 'Empat\u00eda', 'Claridad'],
    answers: [4, 5, 3, 5, 4, 5, 4, 5, 4, 5],
    compatibility: 84
  },
  {
    id: 504,
    name: 'Daniela',
    age: 25,
    city: 'Tijuana',
    bio: 'Valoro la comunicacion directa, el respeto y los planes sencillos.',
    interests: ['Cine', 'Ejercicio', 'Comida'],
    traits: ['Respeto', 'Constancia', 'Honestidad'],
    answers: [5, 5, 4, 5, 5, 4, 4, 4, 5, 5],
    compatibility: 86
  },
  {
    id: 505,
    name: 'Mariana',
    age: 26,
    city: 'Rosarito',
    bio: 'Prefiero conexiones con calma, buen sentido del humor y metas claras.',
    interests: ['Viajes', 'Fotografia', 'Comida'],
    traits: ['Calma', 'Ambicion', 'Alegria'],
    answers: [4, 5, 5, 5, 4, 4, 5, 4, 4, 5],
    compatibility: 82
  },
  {
    id: 506,
    name: 'Renata',
    age: 23,
    city: 'Tecate',
    bio: 'Me encanta la naturaleza, los planes espontaneos y hablar con honestidad.',
    interests: ['Naturaleza', 'Senderismo', 'Mascotas'],
    traits: ['Apertura', 'Honestidad', 'Energia'],
    answers: [4, 4, 5, 4, 5, 5, 4, 3, 5, 4],
    compatibility: 79
  }
];

@Injectable({ providedIn: 'root' })
export class ProfileCrudService extends BaseStorageRepository<PublicProfile> {
  private readonly migrationKey = 'cp_crud_profiles_seed_v2';

  constructor() {
    super('cp_crud_profiles', DEFAULT_PROFILES);
  }

  getProfiles(): PublicProfile[] {
    const profiles = this.readAll();
    const alreadyMigrated = localStorage.getItem(this.migrationKey) === 'true';
    if (alreadyMigrated) return profiles;

    const missingDefaults = DEFAULT_PROFILES.filter(
      (defaultProfile) => !profiles.some((profile) => profile.id === defaultProfile.id)
    );

    if (missingDefaults.length === 0) {
      localStorage.setItem(this.migrationKey, 'true');
      return profiles;
    }

    const merged = [...profiles, ...missingDefaults];
    this.writeAll(merged);
    localStorage.setItem(this.migrationKey, 'true');
    return merged;
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
