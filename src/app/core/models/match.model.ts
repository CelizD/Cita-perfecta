export interface Like {
  fromUserId: number;
  toProfileId: number;
  comment?: string;
  createdAt: string;
}

export interface ConnectionLetter {
  fromUserId: number;
  toProfileId: number;
  message: string;
  createdAt: string;
}

export interface Match {
  id: number;
  userA: number;
  userB: number;
  profileName: string;
  compatibility: number;
  createdAt: string;
  status: 'activo' | 'cerrado';
}
