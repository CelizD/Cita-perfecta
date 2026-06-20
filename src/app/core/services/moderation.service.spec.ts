import { describe, expect, it } from 'vitest';
import { ModerationService } from './moderation.service';

describe('ModerationService', () => {
  it('approves a valid image', async () => {
    const service = Object.assign(Object.create(ModerationService.prototype), {
      uploadService: { validateImage: () => {} }
    }) as ModerationService;
    const file = new File(['image'], 'profile.png', { type: 'image/png' });

    const result = await service.moderateImage(file);
    expect(result.approved).toBe(true);
  });

  it('rejects when validateImage throws', async () => {
    const service = Object.assign(Object.create(ModerationService.prototype), {
      uploadService: { validateImage: () => { throw new Error('Archivo muy grande'); } }
    }) as ModerationService;
    const file = new File(['image'], 'profile.png', { type: 'image/png' });

    const result = await service.moderateImage(file);
    expect(result.approved).toBe(false);
    expect(result.reason).toBe('Archivo muy grande');
  });
});
