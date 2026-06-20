import { describe, expect, it } from 'vitest';
import { LetterService } from './letter.service';

describe('LetterService', () => {
  it('rejects letters shorter than 300 characters', async () => {
    const service = Object.assign(Object.create(LetterService.prototype), {
      supabaseService: { client: {}, requiredConfigMessage: 'missing config' }
    }) as LetterService;

    await expect(service.sendLetter('from-user', 'to-user', 'Hola')).rejects.toThrow(
      'La carta debe tener al menos 300 caracteres.'
    );
  });

  it('fails clearly when Supabase is not configured while loading letters', async () => {
    const service = Object.assign(Object.create(LetterService.prototype), {
      supabaseService: { client: null, requiredConfigMessage: 'missing config' }
    }) as LetterService;

    await expect(service.getLetters('user-id')).rejects.toThrow('missing config');
  });
});
