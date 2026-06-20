import { Injectable, inject } from '@angular/core';
import { UploadService } from './upload.service';

export interface ModerationResult {
  approved: boolean;
  reason: string;
}

@Injectable({ providedIn: 'root' })
export class ModerationService {
  private uploadService = inject(UploadService);

  moderateImage(imageFile: File): Promise<ModerationResult> {
    try {
      this.uploadService.validateImage(imageFile);
      return Promise.resolve({ approved: true, reason: 'Imagen aprobada.' });
    } catch (err) {
      return Promise.resolve({ approved: false, reason: (err as Error).message });
    }
  }
}
