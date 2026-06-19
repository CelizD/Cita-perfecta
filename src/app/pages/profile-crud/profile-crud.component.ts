import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ProfileCrudService } from '../../core/services/profile-crud.service';
import { PublicProfile } from '../../core/models/user.model';

@Component({
  selector: 'app-profile-crud',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './profile-crud.component.html',
  styleUrl: './profile-crud.component.scss'
})
export class ProfileCrudComponent {
  private fb = inject(FormBuilder);
  private profileCrudService = inject(ProfileCrudService);

  editingId: number | null = null;
  pendingDeleteId: number | null = null;
  message = '';
  searchTerm = '';

  profileForm = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    age: [18, [Validators.required, Validators.min(18)]],
    city: ['', Validators.required],
    bio: ['', [Validators.required, Validators.minLength(10)]],
    interests: ['Cafe, Musica, Cine', Validators.required],
    traits: ['Honestidad, Calma, Empatia', Validators.required]
  });

  get profiles(): PublicProfile[] {
    return this.profileCrudService.getProfiles();
  }

  get filteredProfiles(): PublicProfile[] {
    const term = this.normalize(this.searchTerm);
    if (!term) return this.profiles;

    return this.profiles.filter((profile) => {
      const searchable = [
        profile.name,
        profile.city,
        profile.bio,
        ...profile.interests,
        ...profile.traits
      ]
        .map((value) => this.normalize(value))
        .join(' ');

      return searchable.includes(term);
    });
  }

  saveProfile(): void {
    this.profileForm.markAllAsTouched();
    if (this.profileForm.invalid) return;

    const value = this.profileForm.getRawValue();
    const payload = {
      name: value.name,
      age: value.age,
      city: value.city,
      bio: value.bio,
      interests: this.toArray(value.interests),
      traits: this.toArray(value.traits),
      photoProfile: ''
    };

    if (this.editingId) {
      this.profileCrudService.updateProfile(this.editingId, payload);
      this.message = 'Perfil actualizado correctamente.';
    } else {
      this.profileCrudService.createProfile(payload);
      this.message = 'Perfil creado correctamente.';
    }

    this.cancelEdit();
  }

  editProfile(profile: PublicProfile): void {
    this.editingId = profile.id;
    this.pendingDeleteId = null;
    this.message = `Editando perfil de ${profile.name}.`;
    this.profileForm.patchValue({
      name: profile.name,
      age: profile.age,
      city: profile.city,
      bio: profile.bio,
      interests: profile.interests.join(', '),
      traits: profile.traits.join(', ')
    });
  }

  updateSearch(event: Event): void {
    this.searchTerm = (event.target as HTMLInputElement).value;
  }

  requestDelete(profile: PublicProfile): void {
    this.pendingDeleteId = profile.id;
    this.message = `Confirma la eliminacion del perfil de ${profile.name}.`;
  }

  confirmDelete(id: number): void {
    this.profileCrudService.deleteProfile(id);
    this.message = 'Perfil eliminado correctamente.';
    if (this.editingId === id) {
      this.cancelEdit();
    }
    this.pendingDeleteId = null;
  }

  cancelDelete(): void {
    this.pendingDeleteId = null;
    this.message = '';
  }

  cancelEdit(): void {
    this.editingId = null;
    this.profileForm.reset({
      name: '',
      age: 18,
      city: '',
      bio: '',
      interests: 'Cafe, Musica, Cine',
      traits: 'Honestidad, Calma, Empatia'
    });
  }

  private toArray(value: string): string[] {
    return value
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
  }

  private normalize(value: string): string {
    return value
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
  }
}
