import { Injectable, inject } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { UploadService } from './upload.service';

export interface ModerationResult {
  approved: boolean;
  reason: string;
}

@Injectable({ providedIn: 'root' })
export class ModerationService {
  private supabaseService = inject(SupabaseService);
  private uploadService = inject(UploadService);

  async moderateImage(imageFile: File): Promise<ModerationResult> {
    const supabase = this.supabaseService.client;
    if (!supabase) throw new Error(this.supabaseService.requiredConfigMessage);

    this.uploadService.validateImage(imageFile);

    const {
      data: { user }
    } = await supabase.auth.getUser();

    if (!user) throw new Error('Inicia sesion para subir fotos.');

    const safeName = imageFile.name.replace(/[^a-zA-Z0-9._-]/g, '-').toLowerCase();
    const tempPath = `${user.id}/${Date.now()}_${safeName}`;

    const { error: uploadError } = await supabase.storage
      .from('temp-moderation')
      .upload(tempPath, imageFile, {
        contentType: imageFile.type,
        upsert: false
      });

    if (uploadError) throw new Error(uploadError.message);

    try {
      const { data } = await supabase.storage
        .from('temp-moderation')
        .createSignedUrl(tempPath, 5 * 60);

      if (!data?.signedUrl) {
        throw new Error('No se pudo crear una URL temporal para moderar la imagen.');
      }

      const { data: result, error } = await supabase.functions.invoke<ModerationResult>('moderate-image', {
        body: { imageUrl: data.signedUrl }
      });

      if (error) throw new Error(error.message);
      return result ?? { approved: false, reason: 'No se recibio respuesta de moderacion.' };
    } finally {
      await supabase.storage.from('temp-moderation').remove([tempPath]);
    }
  }
}
