import { Injectable } from '@angular/core';
import { ConnectionLetter, Like, Match } from '../models/match.model';
import { UserId } from '../models/user.model';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class MatchService {
  private likesKey = 'cp_likes';
  private lettersKey = 'cp_letters';
  private matchesKey = 'cp_matches';

  constructor(private authService: AuthService) {}

  sendLike(toProfileId: number, profileName: string, compatibility: number, comment?: string): Match {
    const user = this.authService.currentUser();
    if (!user) throw new Error('Usuario no autenticado');

    const like: Like = {
      fromUserId: user.id,
      toProfileId,
      comment,
      createdAt: new Date().toISOString()
    };

    const likes = this.getLikes();
    likes.push(like);
    localStorage.setItem(this.likesKey, JSON.stringify(likes));

    return this.createOrGetMatch(user.id, toProfileId, profileName, compatibility);
  }

  sendLetter(toProfileId: number, message: string): void {
    const user = this.authService.currentUser();
    if (!user) throw new Error('Usuario no autenticado');

    const letters = this.getLetters();
    letters.push({
      fromUserId: user.id,
      toProfileId,
      message,
      createdAt: new Date().toISOString()
    });
    localStorage.setItem(this.lettersKey, JSON.stringify(letters));
  }

  getMatches(): Match[] {
    const user = this.authService.currentUser();
    if (!user) return [];

    const raw = localStorage.getItem(this.matchesKey);
    const matches = raw ? (JSON.parse(raw) as Match[]) : [];
    return matches.filter((match) => match.userA === user.id || match.userB === user.id);
  }

  closeMatch(matchId: number): void {
    const raw = localStorage.getItem(this.matchesKey);
    const matches = raw ? (JSON.parse(raw) as Match[]) : [];
    const updated = matches.map((match) => (match.id === matchId ? { ...match, status: 'cerrado' as const } : match));
    localStorage.setItem(this.matchesKey, JSON.stringify(updated));
  }

  private createOrGetMatch(userId: UserId, profileId: number, profileName: string, compatibility: number): Match {
    const raw = localStorage.getItem(this.matchesKey);
    const matches = raw ? (JSON.parse(raw) as Match[]) : [];

    const existing = matches.find(
      (match) => match.userA === userId && match.userB === profileId && match.status === 'activo'
    );
    if (existing) return existing;

    const match: Match = {
      id: Date.now(),
      userA: userId,
      userB: profileId,
      profileName,
      compatibility,
      createdAt: new Date().toISOString(),
      status: 'activo'
    };

    matches.push(match);
    localStorage.setItem(this.matchesKey, JSON.stringify(matches));
    return match;
  }

  private getLikes(): Like[] {
    const raw = localStorage.getItem(this.likesKey);
    return raw ? (JSON.parse(raw) as Like[]) : [];
  }

  private getLetters(): ConnectionLetter[] {
    const raw = localStorage.getItem(this.lettersKey);
    return raw ? (JSON.parse(raw) as ConnectionLetter[]) : [];
  }
}
