import { describe, expect, it } from 'vitest';
import { ModerationService } from './moderation.service';

describe('ModerationService', () => {
  it('fails clearly when Supabase is not configured', async () => {
    const service = Object.assign(Object.create(ModerationService.prototype), {
      supabaseService: { client: null, requiredConfigMessage: 'missing config' }
    }) as ModerationService;
    const file = new File(['image'], 'profile.png', { type: 'image/png' });

    await expect(service.moderateImage(file)).rejects.toThrow('missing config');
  });
});
