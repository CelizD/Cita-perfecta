export interface Message {
  id: number;
  chatId: number;
  sender: 'yo' | 'match';
  text: string;
  createdAt: string;
}

export interface Chat {
  id: number;
  matchId: number;
  profileId: number;
  profileName: string;
  compatibility: number;
  status: 'activo' | 'cerrado';
  messages: Message[];
}
