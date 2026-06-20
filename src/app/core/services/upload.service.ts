import { Injectable, inject } from '@angular/core';
import { SupabaseService } from './supabase.service';

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

@Injectable({ providedIn: 'root' })
export class UploadService {
  private supabaseService = inject(SupabaseService);

  async uploadProfilePhoto(userId: string, file: File): Promise<string> {
    const supabase = this.supabaseService.client;
    if (!supabase) throw new Error(this.supabaseService.requiredConfigMessage);

    this.validateImage(file);

    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '-').toLowerCase();
    const path = `${userId}/${Date.now()}_${safeName}`;

    const { error } = await supabase.storage
      .from('profile-photos')
      .upload(path, file, {
        cacheControl: '3600',
        contentType: file.type,
        upsert: false
      });

    if (error) throw new Error(error.message);

    const { data } = supabase.storage.from('profile-photos').getPublicUrl(path);
    return data.publicUrl;
  }

  validateImage(file: File): void {
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      throw new Error('Solo se permiten imagenes JPG, PNG o WEBP.');
    }

    if (file.size > MAX_IMAGE_SIZE) {
      throw new Error('La imagen no debe pesar mas de 5 MB.');
    }
  }
}
