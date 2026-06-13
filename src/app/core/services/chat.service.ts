import { Injectable } from '@angular/core';
import { Chat, Message } from '../models/chat.model';
import { Match } from '../models/match.model';
import { MatchService } from './match.service';

@Injectable({ providedIn: 'root' })
export class ChatService {
  private chatsKey = 'cp_chats';

  constructor(private matchService: MatchService) {}

  getChats(): Chat[] {
    const raw = localStorage.getItem(this.chatsKey);
    return raw ? (JSON.parse(raw) as Chat[]) : [];
  }

  findChat(chatId: number): Chat | undefined {
    return this.getChats().find((chat) => chat.id === chatId);
  }

  createChatForMatch(match: Match): Chat {
    const chats = this.getChats();
    const existing = chats.find((chat) => chat.matchId === match.id);
    if (existing) return existing;

    const chat: Chat = {
      id: Date.now() + 1,
      matchId: match.id,
      profileName: match.profileName,
      compatibility: match.compatibility,
      status: 'activo',
      messages: [
        {
          id: Date.now() + 2,
          chatId: Date.now() + 1,
          sender: 'match',
          text: `Hola, soy ${match.profileName}. Me gustó tu forma de conectar con respeto.`,
          createdAt: new Date().toISOString()
        }
      ]
    };

    localStorage.setItem(this.chatsKey, JSON.stringify([...chats, chat]));
    return chat;
  }

  sendMessage(chatId: number, text: string): void {
    const chats = this.getChats();
    const updated = chats.map((chat) => {
      if (chat.id !== chatId || chat.status === 'cerrado') return chat;

      const message: Message = {
        id: Date.now(),
        chatId,
        sender: 'yo',
        text,
        createdAt: new Date().toISOString()
      };

      return { ...chat, messages: [...chat.messages, message] };
    });

    localStorage.setItem(this.chatsKey, JSON.stringify(updated));
  }

  closeChat(chatId: number, reason: string): void {
    const chats = this.getChats();
    const updated = chats.map((chat) => {
      if (chat.id !== chatId) return chat;

      const message: Message = {
        id: Date.now(),
        chatId,
        sender: 'yo',
        text: `Cierre amistoso: ${reason}`,
        createdAt: new Date().toISOString()
      };

      this.matchService.closeMatch(chat.matchId);
      return { ...chat, status: 'cerrado' as const, messages: [...chat.messages, message] };
    });

    localStorage.setItem(this.chatsKey, JSON.stringify(updated));
  }

  getIcebreaker(): string {
    const ideas = [
      '¿Cuál sería tu plan ideal para un domingo tranquilo?',
      '¿Qué canción te representa últimamente?',
      '¿Qué cosa pequeña te hace sentir en paz?',
      '¿Qué valor es indispensable para ti en una relación?'
    ];
    return ideas[Math.floor(Math.random() * ideas.length)];
  }
}
