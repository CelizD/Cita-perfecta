import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ProfileCrudService } from '../../core/services/profile-crud.service';
import { PublicProfile } from '../../core/models/user.model';

@Component({
  selector: 'app-profile-crud',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './profile-crud.component.html',
  styleUrl: './profile-crud.component.scss'
})
export class ProfileCrudComponent {
  private fb = inject(FormBuilder);
  private profileCrudService = inject(ProfileCrudService);

  editingId: number | null = null;
  message = '';

  profileForm = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    age: [18, [Validators.required, Validators.min(18)]],
    city: ['', Validators.required],
    bio: ['', [Validators.required, Validators.minLength(10)]],
    interests: ['Café, Música, Cine', Validators.required],
    traits: ['Honestidad, Calma, Empatía', Validators.required]
  });

  get profiles(): PublicProfile[] {
    return this.profileCrudService.getProfiles();
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

  deleteProfile(id: number): void {
    this.profileCrudService.deleteProfile(id);
    this.message = 'Perfil eliminado correctamente.';
    if (this.editingId === id) {
      this.cancelEdit();
    }
  }

  cancelEdit(): void {
    this.editingId = null;
    this.profileForm.reset({
      name: '',
      age: 18,
      city: '',
      bio: '',
      interests: 'Café, Música, Cine',
      traits: 'Honestidad, Calma, Empatía'
    });
  }

  private toArray(value: string): string[] {
    return value
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
  }
}
