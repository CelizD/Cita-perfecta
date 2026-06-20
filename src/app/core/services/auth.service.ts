import { Injectable, signal } from '@angular/core';
import { User as SupabaseUser } from '@supabase/supabase-js';
import { User } from '../models/user.model';
import { calculateAgeFromBirthDate } from '../utils/date.util';
import { SupabaseService } from './supabase.service';

interface RegisterData {
  name: string;
  email: string;
  password: string;
  birthDate: string;
}

interface AuthResult {
  ok: boolean;
  message: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private sessionKey = 'cp_current_user';

  currentUser = signal<User | null>(this.loadCurrentUser());

  constructor(private supabaseService: SupabaseService) {
    if (!this.supabaseService.client) {
      this.clearSession();
      return;
    }

    void this.restoreSupabaseSession();

    this.supabaseService.client.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        this.setSession(await this.buildAppUser(session.user));
      } else {
        this.clearSession();
      }
    });
  }

  async register(data: RegisterData): Promise<AuthResult> {
    const supabase = this.supabaseService.client;
    if (!supabase) {
      return { ok: false, message: this.supabaseService.requiredConfigMessage };
    }

    const age = calculateAgeFromBirthDate(data.birthDate);
    if (age < 18) {
      return { ok: false, message: 'Debes tener al menos 18 anos para usar Cita Perfecta.' };
    }

    const { data: authData, error } = await supabase.auth.signUp({
      email: data.email.trim().toLowerCase(),
      password: data.password,
      options: {
        data: {
          name: data.name.trim(),
          birthDate: data.birthDate,
          age,
          pactAccepted: false,
          profileComplete: false,
          testComplete: false,
          pauseMode: false,
          premium: false,
          interests: []
        }
      }
    });

    if (error) {
      return { ok: false, message: this.translateAuthError(error.message) };
    }

    if (authData.session?.user) {
      const appUser = await this.buildAppUser(authData.session.user);
      this.setSession(appUser);
      void this.upsertProfile(appUser);
      return { ok: true, message: 'Cuenta creada correctamente.' };
    }

    return {
      ok: true,
      message: 'Cuenta creada. Revisa tu correo si Supabase te pide confirmar la cuenta antes de entrar.'
    };
  }

  async login(email: string, password: string): Promise<AuthResult> {
    const supabase = this.supabaseService.client;
    if (!supabase) {
      return { ok: false, message: this.supabaseService.requiredConfigMessage };
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password
    });

    if (error || !data.user) {
      return { ok: false, message: this.translateAuthError(error?.message ?? 'No se pudo iniciar sesion.') };
    }

    this.setSession(await this.buildAppUser(data.user));
    return { ok: true, message: 'Inicio de sesion correcto.' };
  }

  logout(): void {
    void this.supabaseService.client?.auth.signOut();
    this.clearSession();
  }

  updateCurrentUser(patch: Partial<User>): void {
    const current = this.currentUser();
    if (!current) return;

    const updated: User = { ...current, ...patch };
    this.setSession(updated);

    void this.supabaseService.client?.auth.updateUser({
      data: this.toUserMetadata(updated)
    });
    void this.upsertProfile(updated);
  }

  isLoggedIn(): boolean {
    return this.currentUser() !== null;
  }

  private async restoreSupabaseSession(): Promise<void> {
    const supabase = this.supabaseService.client;
    if (!supabase) return;

    const { data } = await supabase.auth.getSession();
    if (data.session?.user) {
      this.setSession(await this.buildAppUser(data.session.user));
    }
  }

  private setSession(user: User): void {
    localStorage.setItem(this.sessionKey, JSON.stringify(user));
    this.currentUser.set(user);
  }

  private clearSession(): void {
    localStorage.removeItem(this.sessionKey);
    this.currentUser.set(null);
  }

  private loadCurrentUser(): User | null {
    const raw = localStorage.getItem(this.sessionKey);
    return raw ? (JSON.parse(raw) as User) : null;
  }

  private async buildAppUser(user: SupabaseUser): Promise<User> {
    const appUser = this.toAppUser(user);
    const profile = await this.getProfileRow(user.id);
    return profile ? this.mergeProfileRow(appUser, profile) : appUser;
  }

  private toAppUser(user: SupabaseUser): User {
    const metadata = user.user_metadata ?? {};
    const existing = this.loadCurrentUser();
    const birthDate = String(metadata['birthDate'] ?? existing?.birthDate ?? '');
    const ageFromMetadata = Number(metadata['age'] ?? existing?.age ?? 18);

    return {
      id: user.id,
      name: String(metadata['name'] ?? existing?.name ?? user.email?.split('@')[0] ?? 'Usuario'),
      email: user.email ?? existing?.email ?? '',
      birthDate,
      age: birthDate ? calculateAgeFromBirthDate(birthDate) : ageFromMetadata,
      city: String(metadata['city'] ?? existing?.city ?? ''),
      bio: String(metadata['bio'] ?? existing?.bio ?? ''),
      interests: this.toStringArray(metadata['interests'] ?? existing?.interests ?? []),
      communicationStyle: String(metadata['communicationStyle'] ?? existing?.communicationStyle ?? ''),
      loveLanguage: String(metadata['loveLanguage'] ?? existing?.loveLanguage ?? ''),
      dealbreakers: this.toStringArray(metadata['dealbreakers'] ?? existing?.dealbreakers ?? []),
      photoProfile: String(metadata['photoProfile'] ?? existing?.photoProfile ?? ''),
      pactAccepted: Boolean(metadata['pactAccepted'] ?? existing?.pactAccepted ?? false),
      profileComplete: Boolean(metadata['profileComplete'] ?? existing?.profileComplete ?? false),
      testComplete: Boolean(metadata['testComplete'] ?? existing?.testComplete ?? false),
      pauseMode: Boolean(metadata['pauseMode'] ?? existing?.pauseMode ?? false),
      premium: Boolean(metadata['premium'] ?? existing?.premium ?? false)
    };
  }

  private toUserMetadata(user: User): Record<string, unknown> {
    return {
      name: user.name,
      birthDate: user.birthDate,
      age: user.age,
      city: user.city,
      bio: user.bio,
      interests: user.interests,
      communicationStyle: user.communicationStyle,
      loveLanguage: user.loveLanguage,
      dealbreakers: user.dealbreakers,
      photoProfile: user.photoProfile,
      pactAccepted: user.pactAccepted,
      profileComplete: user.profileComplete,
      testComplete: user.testComplete,
      pauseMode: user.pauseMode,
      premium: user.premium
    };
  }

  private async getProfileRow(userId: string): Promise<Record<string, unknown> | null> {
    const supabase = this.supabaseService.client;
    if (!supabase) return null;

    const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
    if (error) return null;
    return data as Record<string, unknown> | null;
  }

  private async upsertProfile(user: User): Promise<void> {
    const supabase = this.supabaseService.client;
    if (!supabase || typeof user.id !== 'string') return;

    await supabase.from('profiles').upsert({
      id: user.id,
      email: user.email,
      name: user.name,
      birth_date: user.birthDate || null,
      age: user.age,
      city: user.city || null,
      bio: user.bio || null,
      interests: user.interests ?? [],
      communication_style: user.communicationStyle || null,
      love_language: user.loveLanguage || null,
      dealbreakers: user.dealbreakers ?? [],
      photo_profile: user.photoProfile || null,
      pact_accepted: user.pactAccepted,
      profile_complete: user.profileComplete,
      test_complete: user.testComplete,
      pause_mode: user.pauseMode,
      premium: user.premium,
      updated_at: new Date().toISOString()
    });
  }

  private mergeProfileRow(user: User, profile: Record<string, unknown>): User {
    return {
      ...user,
      name: String(profile['name'] ?? user.name),
      email: String(profile['email'] ?? user.email),
      birthDate: String(profile['birth_date'] ?? user.birthDate ?? ''),
      age: Number(profile['age'] ?? user.age),
      city: String(profile['city'] ?? user.city ?? ''),
      bio: String(profile['bio'] ?? user.bio ?? ''),
      interests: this.toStringArray(profile['interests'] ?? user.interests ?? []),
      communicationStyle: String(profile['communication_style'] ?? user.communicationStyle ?? ''),
      loveLanguage: String(profile['love_language'] ?? user.loveLanguage ?? ''),
      dealbreakers: this.toStringArray(profile['dealbreakers'] ?? user.dealbreakers ?? []),
      photoProfile: String(profile['photo_profile'] ?? user.photoProfile ?? ''),
      pactAccepted: Boolean(profile['pact_accepted'] ?? user.pactAccepted),
      profileComplete: Boolean(profile['profile_complete'] ?? user.profileComplete),
      testComplete: Boolean(profile['test_complete'] ?? user.testComplete),
      pauseMode: Boolean(profile['pause_mode'] ?? user.pauseMode),
      premium: Boolean(profile['premium'] ?? user.premium)
    };
  }

  private toStringArray(value: unknown): string[] {
    return Array.isArray(value) ? value.map(String) : [];
  }

  private translateAuthError(message: string): string {
    const normalized = message.toLowerCase();

    if (normalized.includes('invalid login credentials')) {
      return 'Correo o contrasena incorrectos.';
    }

    if (normalized.includes('already registered') || normalized.includes('already been registered')) {
      return 'Este correo ya esta registrado.';
    }

    if (normalized.includes('email not confirmed')) {
      return 'Confirma tu correo antes de iniciar sesion.';
    }

    return message;
  }
}
