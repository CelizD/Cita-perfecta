import { UserId } from './user.model';

export interface Report {
  fromUserId: UserId;
  toProfileId: number;
  reason: string;
  description: string;
  createdAt: string;
}
