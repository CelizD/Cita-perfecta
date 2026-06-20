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
    bio: 'Me gustan los planes tranquilos, el cafe y las conexiones honestas.',
    interests: ['Cafe', 'Musica', 'Cine'],
    traits: ['Honestidad', 'Calma', 'Empatia'],
    communicationStyle: 'Tranquilo y reflexivo',
    loveLanguage: 'Tiempo de calidad',
    dealbreakers: ['Ghosting constante', 'Falta de respeto'],
    prompt: 'Una buena primera carta para mi habla de un plan sencillo y real.',
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
    communicationStyle: 'Directo y claro',
    loveLanguage: 'Actos de servicio',
    dealbreakers: ['Presion o manipulacion', 'Relaciones sin claridad'],
    prompt: 'Me interesa alguien que pueda decir lo que busca sin jugar.',
    answers: [5, 4, 5, 4, 5, 4, 5, 3, 5, 5],
    compatibility: 88
  },
  {
    id: 503,
    name: 'Camila',
    age: 22,
    city: 'Mexicali',
    bio: 'Me gusta la musica en vivo, los cafes bonitos y aprender cosas nuevas.',
    interests: ['Musica', 'Cafe', 'Arte'],
    traits: ['Creatividad', 'Empatia', 'Claridad'],
    communicationStyle: 'Expresivo y emocional',
    loveLanguage: 'Palabras de afirmacion',
    dealbreakers: ['Falta de respeto', 'Planes sin honestidad'],
    prompt: 'Rompe el hielo contandome una cancion que te define.',
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
    communicationStyle: 'Directo y claro',
    loveLanguage: 'Detalles significativos',
    dealbreakers: ['Presion o manipulacion', 'Ghosting constante'],
    prompt: 'Prefiero pocas conversaciones, pero con intencion real.',
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
    communicationStyle: 'Tranquilo y reflexivo',
    loveLanguage: 'Tiempo de calidad',
    dealbreakers: ['Relaciones sin claridad', 'Planes sin honestidad'],
    prompt: 'Un buen match para mi sabe avanzar sin presionar.',
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
    communicationStyle: 'Practico y breve',
    loveLanguage: 'Actos de servicio',
    dealbreakers: ['Falta de respeto', 'Presion o manipulacion'],
    prompt: 'Si me escribes una carta, empieza con tu lugar favorito para desconectarte.',
    answers: [4, 4, 5, 4, 5, 5, 4, 3, 5, 4],
    compatibility: 79
  }
];

@Injectable({ providedIn: 'root' })
export class ProfileCrudService extends BaseStorageRepository<PublicProfile> {
  private readonly migrationKey = 'cp_crud_profiles_seed_v3';

  constructor() {
    super('cp_crud_profiles', DEFAULT_PROFILES);
  }

  getProfiles(): PublicProfile[] {
    const profiles = this.readAll();
    const alreadyMigrated = localStorage.getItem(this.migrationKey) === 'true';
    if (alreadyMigrated) return profiles;

    const byId = new Map(DEFAULT_PROFILES.map((profile) => [profile.id, profile]));
    const enrichedProfiles = profiles.map((profile) => {
      const defaultProfile = byId.get(profile.id);
      return defaultProfile ? { ...defaultProfile, ...profile } : profile;
    });

    const missingDefaults = DEFAULT_PROFILES.filter(
      (defaultProfile) => !enrichedProfiles.some((profile) => profile.id === defaultProfile.id)
    );
    const merged = [...enrichedProfiles, ...missingDefaults];

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
