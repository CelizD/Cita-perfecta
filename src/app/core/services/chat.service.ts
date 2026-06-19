import { Injectable } from '@angular/core';
import { Chat, Message } from '../models/chat.model';
import { Match } from '../models/match.model';
import { MatchService } from './match.service';
import { ProfileCrudService } from './profile-crud.service';

@Injectable({ providedIn: 'root' })
export class ChatService {
  private chatsKey = 'cp_chats';

  constructor(
    private matchService: MatchService,
    private profileCrudService: ProfileCrudService
  ) {}

  getChats(): Chat[] {
    const raw = localStorage.getItem(this.chatsKey);
    const chats = raw ? (JSON.parse(raw) as Chat[]) : [];
    const validProfileIds = new Set(this.profileCrudService.getProfiles().map((profile) => profile.id));

    return chats.filter((chat) => validProfileIds.has(chat.profileId));
  }

  findChat(chatId: number): Chat | undefined {
    return this.getChats().find((chat) => chat.id === chatId);
  }

  createChatForMatch(match: Match): Chat {
    const chats = this.getChats();
    const existing = chats.find((chat) => chat.matchId === match.id);
    if (existing) return existing;

    const chatId = Date.now() + 1;
    const chat: Chat = {
      id: chatId,
      matchId: match.id,
      profileId: match.userB,
      profileName: match.profileName,
      compatibility: match.compatibility,
      status: 'activo',
      messages: [
        {
          id: Date.now() + 2,
          chatId,
          sender: 'match',
          text: `Hola, soy ${match.profileName}. Me gusto tu forma de conectar con respeto.`,
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
      'Cual seria tu plan ideal para un domingo tranquilo?',
      'Que cancion te representa ultimamente?',
      'Que cosa pequena te hace sentir en paz?',
      'Que valor es indispensable para ti en una relacion?'
    ];
    return ideas[Math.floor(Math.random() * ideas.length)];
  }
}
