import { Injectable, signal } from '@angular/core';
import { User } from '../models/user.model';
import { calculateAgeFromBirthDate } from '../utils/date.util';

interface RegisterData {
  name: string;
  email: string;
  password: string;
  birthDate: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private usersKey = 'cp_users';
  private sessionKey = 'cp_current_user';

  currentUser = signal<User | null>(this.loadCurrentUser());

  register(data: RegisterData): { ok: boolean; message: string } {
    const age = calculateAgeFromBirthDate(data.birthDate);
    if (age < 18) {
      return { ok: false, message: 'Debes tener al menos 18 años para usar Cita Perfecta.' };
    }

    const users = this.getUsers();
    const exists = users.some((user) => user.email.toLowerCase() === data.email.toLowerCase());
    if (exists) {
      return { ok: false, message: 'Este correo ya está registrado.' };
    }

    const newUser: User = {
      id: Date.now(),
      name: data.name.trim(),
      email: data.email.trim().toLowerCase(),
      password: data.password,
      birthDate: data.birthDate,
      age,
      interests: [],
      pactAccepted: false,
      profileComplete: false,
      testComplete: false,
      pauseMode: false,
      premium: false
    };

    users.push(newUser);
    this.saveUsers(users);
    this.setSession(newUser);
    return { ok: true, message: 'Cuenta creada correctamente.' };
  }

  login(email: string, password: string): { ok: boolean; message: string } {
    const user = this.getUsers().find(
      (item) => item.email === email.trim().toLowerCase() && item.password === password
    );

    if (!user) {
      return { ok: false, message: 'Correo o contraseña incorrectos.' };
    }

    this.setSession(user);
    return { ok: true, message: 'Inicio de sesión correcto.' };
  }

  logout(): void {
    localStorage.removeItem(this.sessionKey);
    this.currentUser.set(null);
  }

  updateCurrentUser(patch: Partial<User>): void {
    const current = this.currentUser();
    if (!current) return;

    const updated: User = { ...current, ...patch };
    this.currentUser.set(updated);
    localStorage.setItem(this.sessionKey, JSON.stringify(updated));

    const users = this.getUsers().map((user) => (user.id === updated.id ? updated : user));
    this.saveUsers(users);
  }

  isLoggedIn(): boolean {
    return this.currentUser() !== null;
  }

  private setSession(user: User): void {
    localStorage.setItem(this.sessionKey, JSON.stringify(user));
    this.currentUser.set(user);
  }

  private loadCurrentUser(): User | null {
    const raw = localStorage.getItem(this.sessionKey);
    return raw ? (JSON.parse(raw) as User) : null;
  }

  private getUsers(): User[] {
    const raw = localStorage.getItem(this.usersKey);
    return raw ? (JSON.parse(raw) as User[]) : [];
  }

  private saveUsers(users: User[]): void {
    localStorage.setItem(this.usersKey, JSON.stringify(users));
  }
}
