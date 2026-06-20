import { describe, expect, it } from 'vitest';
import { NotificationService } from './notification.service';

describe('NotificationService', () => {
  it('fails clearly when Supabase is not configured', async () => {
    const service = Object.assign(Object.create(NotificationService.prototype), {
      supabaseService: { client: null, requiredConfigMessage: 'missing config' }
    }) as NotificationService;

    await expect(service.registerToken('token')).rejects.toThrow('missing config');
  });
});
