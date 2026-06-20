import { Injectable, inject } from '@angular/core';
import { SupabaseService } from './supabase.service';

export interface LetterQuota {
  used: number;
  limit: number;
  remaining: number;
  resetAt: string;
}

@Injectable({ providedIn: 'root' })
export class LetterService {
  private supabaseService = inject(SupabaseService);

  async sendLetter(fromUserId: string, toUserId: string, content: string): Promise<void> {
    const supabase = this.supabaseService.client;
    if (!supabase) throw new Error(this.supabaseService.requiredConfigMessage);

    const trimmed = content.trim();
    if (trimmed.length < 300) {
      throw new Error('La carta debe tener al menos 300 caracteres.');
    }

    const quota = await this.getQuota(fromUserId);
    if (quota.remaining <= 0) {
      throw new Error('Ya usaste tus cartas disponibles de este mes.');
    }

    const { error: letterError } = await supabase.from('connection_letters').insert({
      from_user_id: fromUserId,
      to_user_id: toUserId,
      message: trimmed,
      status: 'sent'
    });

    if (letterError) throw new Error(letterError.message);

    const { error: profileError } = await supabase
      .from('profiles')
      .update({ letters_used_this_month: quota.used + 1 })
      .eq('id', fromUserId);

    if (profileError) throw new Error(profileError.message);
  }

  async getLetters(userId: string) {
    const supabase = this.supabaseService.client;
    if (!supabase) throw new Error(this.supabaseService.requiredConfigMessage);

    const { data, error } = await supabase
      .from('connection_letters')
      .select('*')
      .or(`from_user_id.eq.${userId},to_user_id.eq.${userId}`)
      .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);
    return data ?? [];
  }

  async markLetterAsRead(letterId: string): Promise<void> {
    const supabase = this.supabaseService.client;
    if (!supabase) throw new Error(this.supabaseService.requiredConfigMessage);

    const { error } = await supabase
      .from('connection_letters')
      .update({ status: 'read', read_at: new Date().toISOString() })
      .eq('id', letterId);

    if (error) throw new Error(error.message);
  }

  async getQuota(userId: string): Promise<LetterQuota> {
    const supabase = this.supabaseService.client;
    if (!supabase) throw new Error(this.supabaseService.requiredConfigMessage);

    const { data, error } = await supabase
      .from('profiles')
      .select('premium, letters_used_this_month, letters_reset_at')
      .eq('id', userId)
      .single();

    if (error) throw new Error(error.message);

    const limit = data?.premium ? 10 : 3;
    const resetAt = data?.letters_reset_at ? new Date(data.letters_reset_at) : new Date();
    const now = new Date();

    if (resetAt <= now) {
      const nextReset = new Date(now);
      nextReset.setMonth(nextReset.getMonth() + 1);

      await supabase
        .from('profiles')
        .update({ letters_used_this_month: 0, letters_reset_at: nextReset.toISOString() })
        .eq('id', userId);

      return { used: 0, limit, remaining: limit, resetAt: nextReset.toISOString() };
    }

    const used = Number(data?.letters_used_this_month ?? 0);
    return {
      used,
      limit,
      remaining: Math.max(limit - used, 0),
      resetAt: resetAt.toISOString()
    };
  }
}
