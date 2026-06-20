import { Injectable, inject } from '@angular/core';
import { RealtimeChannel } from '@supabase/supabase-js';
import { SupabaseService } from './supabase.service';

export interface ChatMessage {
  id: string;
  chat_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  read_at?: string | null;
}

@Injectable({ providedIn: 'root' })
export class ChatService {
  private supabase = inject(SupabaseService);

  async getChatByMatch(matchId: string) {
    const chat = await this.supabase.createChat(matchId);
    if (chat.error) throw new Error(chat.error.message);
    return chat.data;
  }

  async getMessages(chatId: string): Promise<ChatMessage[]> {
    const { data, error } = await this.supabase.getMessages(chatId);
    if (error) throw new Error(error.message);
    return (data ?? []) as ChatMessage[];
  }

  async sendMessage(chatId: string, senderId: string, content: string): Promise<ChatMessage> {
    const { data, error } = await this.supabase.sendMessage(chatId, senderId, content);
    if (error) throw new Error(error.message);
    return data as ChatMessage;
  }

  subscribeToChat(chatId: string, callback: (message: ChatMessage) => void): RealtimeChannel {
    return this.supabase.subscribeToChat(chatId, (payload) => callback(payload.new as ChatMessage));
  }

  unsubscribe(channel: RealtimeChannel) {
    return this.supabase.unsubscribe(channel);
  }

  async markAsRead(chatId: string, userId: string): Promise<void> {
    const { error } = await this.supabase.markMessagesAsRead(chatId, userId);
    if (error) throw new Error(error.message);
  }
}
