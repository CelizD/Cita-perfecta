import { UserId } from './user.model';

export interface Like {
  fromUserId: UserId;
  toProfileId: number;
  comment?: string;
  createdAt: string;
}

export interface ConnectionLetter {
  fromUserId: UserId;
  toProfileId: number;
  message: string;
  createdAt: string;
}

export interface Match {
  id: number;
  userA: UserId;
  userB: number;
  profileName: string;
  compatibility: number;
  createdAt: string;
  status: 'activo' | 'cerrado';
}
