import { Injectable, inject } from '@angular/core';
import { SupabaseService } from './supabase.service';

export interface MatchResult {
  matched: boolean;
  matchId?: string;
  chatId?: string;
}

@Injectable({ providedIn: 'root' })
export class MatchService {
  private supabase = inject(SupabaseService);

  async sendLike(fromUserId: string, toUserId: string, comment?: string): Promise<MatchResult> {
    const swipe = await this.supabase.sendSwipe(fromUserId, toUserId, 'like', comment);
    if (swipe.error) throw new Error(swipe.error.message);

    const mutualLike = await this.supabase.checkMutualLike(fromUserId, toUserId);
    if (mutualLike.error || !mutualLike.data) {
      return { matched: false };
    }

    const match = await this.createMatch(fromUserId, toUserId);
    return {
      matched: true,
      matchId: match.matchId,
      chatId: match.chatId
    };
  }

  async sendPass(fromUserId: string, toUserId: string): Promise<void> {
    const { error } = await this.supabase.sendSwipe(fromUserId, toUserId, 'pass');
    if (error) throw new Error(error.message);
  }

  async createMatch(userA: string, userB: string): Promise<{ matchId: string; chatId: string }> {
    const match = await this.supabase.createMatch(userA, userB);
    if (match.error) throw new Error(match.error.message);

    const chat = await this.supabase.createChat(match.data['id']);
    if (chat.error) throw new Error(chat.error.message);

    return {
      matchId: match.data['id'],
      chatId: chat.data['id']
    };
  }

  async getMatches(userId: string) {
    const { data, error } = await this.supabase.getMatches(userId);
    if (error) throw new Error(error.message);
    return (data ?? []).filter((match: any) => match.status === 'active');
  }

  async getMatch(matchId: string) {
    const { data, error } = await this.supabase.getMatch(matchId);
    if (error) throw new Error(error.message);
    return data;
  }
}
