import { describe, expect, it } from 'vitest';
import { UploadService } from './upload.service';

describe('UploadService', () => {
  function setup() {
    return Object.create(UploadService.prototype) as UploadService;
  }

  it('accepts valid profile image files', () => {
    const service = setup();
    const file = new File(['image'], 'profile.webp', { type: 'image/webp' });

    expect(() => service.validateImage(file)).not.toThrow();
  });

  it('rejects unsupported image types', () => {
    const service = setup();
    const file = new File(['bad'], 'profile.gif', { type: 'image/gif' });

    expect(() => service.validateImage(file)).toThrow('Solo se permiten imagenes JPG, PNG o WEBP.');
  });
});
