import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { SupabaseService } from '../../core/services/supabase.service';
import { UploadService } from '../../core/services/upload.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss'
})
export class ProfileComponent implements OnInit {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private supabaseService = inject(SupabaseService);
  private uploadService = inject(UploadService);

  loading = signal(false);
  uploading = signal(false);
  errorMessage = signal('');
  successMessage = signal('');
  photoPreview = signal('');

  form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    city: ['', Validators.required],
    bio: ['', [Validators.required, Validators.minLength(20)]],
    interests: [''],
    communicationStyle: [''],
    loveLanguage: ['']
  });

  ngOnInit(): void {
    const user = this.authService.currentUser();
    if (!user) return;

    this.form.patchValue({
      name: user.name,
      city: user.city ?? '',
      bio: user.bio ?? '',
      interests: (user.interests ?? []).join(', '),
      communicationStyle: user.communicationStyle ?? '',
      loveLanguage: user.loveLanguage ?? ''
    });
    this.photoPreview.set(user.photoProfile ?? '');
  }

  async saveProfile(): Promise<void> {
    const user = this.authService.currentUser();
    const supabase = this.supabaseService.client;
    if (!user || this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.clearMessages();

    try {
      const value = this.form.getRawValue();
      const interests = value.interests
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean);

      if (supabase) {
        const { error } = await supabase
          .from('profiles')
          .update({
            name: value.name.trim(),
            city: value.city.trim(),
            bio: value.bio.trim(),
            interests,
            communication_style: value.communicationStyle.trim(),
            love_language: value.loveLanguage.trim(),
            profile_complete: true,
            updated_at: new Date().toISOString()
          })
          .eq('id', user.id);

        if (error) throw new Error(error.message);
      }

      this.authService.updateCurrentUser({
        name: value.name.trim(),
        city: value.city.trim(),
        bio: value.bio.trim(),
        interests,
        communicationStyle: value.communicationStyle.trim(),
        loveLanguage: value.loveLanguage.trim(),
        profileComplete: true
      });

      this.successMessage.set('Perfil actualizado correctamente.');
    } catch (error) {
      this.errorMessage.set(error instanceof Error ? error.message : 'No se pudo guardar el perfil.');
    } finally {
      this.loading.set(false);
    }
  }

  async onPhotoSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    const user = this.authService.currentUser();
    const supabase = this.supabaseService.client;
    if (!user || !supabase || typeof user.id !== 'string') {
      this.errorMessage.set('Inicia sesion para subir tu foto.');
      return;
    }

    this.uploading.set(true);
    this.clearMessages();

    try {
      this.uploadService.validateImage(file);
      const photo = await this.uploadService.uploadProfilePhoto(user.id, file);
      const { error } = await supabase
        .from('profiles')
        .update({
          main_photo_path: photo.path,
          main_photo_url: null,
          photo_url: null,
          photo_profile: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (error) throw new Error(error.message);

      this.authService.updateCurrentUser({ photoProfile: photo.url });
      this.photoPreview.set(photo.url);
      this.successMessage.set('Foto subida correctamente.');
    } catch (error) {
      this.errorMessage.set(error instanceof Error ? error.message : 'No se pudo subir la foto.');
    } finally {
      this.uploading.set(false);
      input.value = '';
    }
  }

  private clearMessages(): void {
    this.errorMessage.set('');
    this.successMessage.set('');
  }
}
