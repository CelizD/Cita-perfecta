import { Injectable } from '@angular/core';
import { createClient, SupabaseClient, User } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';

export interface Question {
  id: number;
  text: string;
  category?: string;
  weight?: number;
  is_initial?: boolean;
  is_active?: boolean;
}

@Injectable({ providedIn: 'root' })
export class SupabaseService {
  private supabase: SupabaseClient;

  constructor() {
    this.supabase = createClient(environment.supabase.url, environment.supabase.anonKey, {
      auth: {
        autoRefreshToken: true,
        detectSessionInUrl: true,
        persistSession: true
      }
    });
  }

  signUp(email: string, password: string) {
    return this.supabase.auth.signUp({
      email,
      password
    });
  }

  signIn(email: string, password: string) {
    return this.supabase.auth.signInWithPassword({
      email,
      password
    });
  }

  signOut() {
    return this.supabase.auth.signOut();
  }

  async getCurrentUser(): Promise<User | null> {
    const { data, error } = await this.supabase.auth.getUser();
    if (error) return null;
    return data.user;
  }

  getProfile(userId: string) {
    return this.supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
  }

  createProfile(userId: string, data: any) {
    return this.supabase
      .from('profiles')
      .insert({
        id: userId,
        ...data
      })
      .select()
      .single();
  }

  updateProfile(userId: string, data: any) {
    return this.supabase
      .from('profiles')
      .update(data)
      .eq('id', userId)
      .select()
      .single();
  }

  async getInitialQuestions() {
    const initialQuestions = await this.supabase
      .from('questions')
      .select('*')
      .eq('is_initial', true)
      .order('id', { ascending: true })
      .limit(15);

    if (!initialQuestions.error) {
      return initialQuestions;
    }

    return this.supabase
      .from('questions')
      .select('*')
      .eq('is_active', true)
      .order('id', { ascending: true })
      .limit(15);
  }

  async saveAnswers(userId: string, answers: { question_id: number; value: number }[]) {
    const { error: deleteError } = await this.supabase
      .from('answers')
      .delete()
      .eq('user_id', userId);

    if (deleteError) {
      return { data: null, error: deleteError };
    }

    const rows = answers.map((answer) => ({
      user_id: userId,
      question_id: answer.question_id,
      value: answer.value
    }));

    if (rows.length === 0) {
      return { data: [], error: null };
    }

    return this.supabase
      .from('answers')
      .insert(rows)
      .select();
  }

  getAnswers(userId: string) {
    return this.supabase
      .from('answers')
      .select('question_id, value')
      .eq('user_id', userId)
      .order('question_id', { ascending: true });
  }

  sendSwipe(fromUserId: string, toUserId: string, action: 'like' | 'pass', comment?: string) {
    return this.supabase
      .from('swipes')
      .insert({
        from_user_id: fromUserId,
        to_user_id: toUserId,
        action,
        comment: comment ?? null
      })
      .select()
      .single();
  }

  getMatches(userId: string) {
    return this.supabase
      .from('matches')
      .select(`
        *,
        user_a_profile:profiles!matches_user_a_fkey(*),
        user_b_profile:profiles!matches_user_b_fkey(*)
      `)
      .or(`user_a.eq.${userId},user_b.eq.${userId}`)
      .order('created_at', { ascending: false });
  }

  updateOnboardingStatus(userId: string) {
    return this.supabase
      .from('profiles')
      .update({ is_onboarded: true })
      .eq('id', userId)
      .select()
      .single();
  }
}
