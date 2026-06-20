import { beforeEach, describe, expect, it } from 'vitest';
import { CompatibilityService } from './compatibility.service';
import { PublicProfile, User } from '../models/user.model';

class MemoryStorage {
  private store = new Map<string, string>();

  getItem(key: string): string | null {
    return this.store.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    this.store.set(key, value);
  }

  clear(): void {
    this.store.clear();
  }
}

describe('CompatibilityService', () => {
  const user: User = {
    id: 'user-1',
    name: 'Test User',
    email: 'test@example.com',
    birthDate: '2000-01-01',
    age: 26,
    interests: ['Cafe', 'Musica'],
    dealbreakers: ['Ghosting constante'],
    pactAccepted: true,
    profileComplete: true,
    testComplete: true,
    pauseMode: false,
    premium: false
  };

  const profiles: PublicProfile[] = [
    {
      id: 1,
      name: 'Valeria',
      age: 23,
      city: 'Tijuana',
      bio: 'Perfil compatible',
      interests: ['Cafe', 'Musica'],
      traits: ['Calma'],
      answers: [5, 5, 5, 5, 5, 5, 5, 5, 5, 5],
      dealbreakers: [],
      compatibility: 91
    },
    {
      id: 2,
      name: 'Sofia',
      age: 24,
      city: 'Ensenada',
      bio: 'Perfil con choque',
      interests: ['Cafe', 'Musica'],
      traits: ['Honestidad'],
      answers: [5, 5, 5, 5, 5, 5, 5, 5, 5, 5],
      dealbreakers: ['Ghosting constante'],
      compatibility: 95
    }
  ];

  beforeEach(() => {
    Object.defineProperty(globalThis, 'localStorage', {
      configurable: true,
      value: new MemoryStorage()
    });
  });

  it('caps compatibility when a profile conflicts with user dealbreakers', () => {
    const service = new CompatibilityService(
      { currentUser: () => user, updateCurrentUser: () => undefined } as any,
      { getProfiles: () => profiles } as any
    );

    const answers = service.questions.map((question) => ({ questionId: question.id, value: 5 }));
    localStorage.setItem(`cp_answers_${user.id}`, JSON.stringify(answers));

    const result = service.getRecommendedProfiles();
    const conflict = result.find((profile) => profile.id === 2);

    expect(conflict?.compatibility).toBe(55);
  });
});
