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

  // H-003: cuota validada en el servidor mediante la RPC send_connection_letter
  async sendLetter(_fromUserId: string, toUserId: string, content: string): Promise<void> {
    if (content.trim().length < 300) {
      throw new Error('La carta debe tener al menos 300 caracteres.');
    }
    const supabase = this.supabaseService.client;
    if (!supabase) throw new Error(this.supabaseService.requiredConfigMessage);

    const { data, error } = await supabase.rpc('send_connection_letter', {
      p_to_user_id: toUserId,
      p_message: content
    });

    if (error) throw new Error(error.message);

    const result = data as { ok: boolean; error?: string } | null;
    if (!result?.ok) throw new Error(result?.error ?? 'No se pudo enviar la carta.');
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
      .select('premium, is_premium, letters_used_this_month, letters_reset_at')
      .or(`id.eq.${userId},user_id.eq.${userId}`)
      .limit(1)
      .maybeSingle();

    if (error) throw new Error(error.message);

    const isPremium = Boolean(data?.premium || data?.is_premium);
    const limit = isPremium ? 10 : 3;
    const resetAt = data?.letters_reset_at ? new Date(data.letters_reset_at) : new Date();
    const used = Number(data?.letters_used_this_month ?? 0);

    return {
      used,
      limit,
      remaining: Math.max(limit - used, 0),
      resetAt: resetAt.toISOString()
    };
  }
}
