import { describe, expect, it, vi } from 'vitest';
import { ProfileCardComponent } from './profile-card.component';

describe('ProfileCardComponent', () => {
  it('builds initials from the profile name', () => {
    const component = new ProfileCardComponent();
    component.profile = {
      id: 1,
      name: 'Valeria',
      age: 23,
      city: 'Tijuana',
      bio: 'Bio',
      interests: ['Cafe'],
      traits: ['Calma'],
      answers: [4, 4, 4, 4, 4, 4, 4, 4, 4, 4],
      compatibility: 90
    };

    expect(component.initials).toBe('VA');
  });

  it('emits the selected profile when the user sends a like', () => {
    const component = new ProfileCardComponent();
    const emit = vi.spyOn(component.likeClicked, 'emit');
    component.profile = {
      id: 2,
      name: 'Sofia',
      age: 24,
      city: 'Ensenada',
      bio: 'Bio',
      interests: ['Lectura'],
      traits: ['Honestidad'],
      answers: [4, 4, 4, 4, 4, 4, 4, 4, 4, 4],
      compatibility: 88
    };

    component.notifyLike();

    expect(emit).toHaveBeenCalledWith(component.profile);
  });
});
