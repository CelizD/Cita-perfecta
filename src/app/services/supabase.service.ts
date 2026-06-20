import { Injectable } from '@angular/core';
import { createClient, RealtimeChannel, SupabaseClient, User } from '@supabase/supabase-js';
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

  getProfilesForCompatibility(userId: string, limit = 50) {
    return this.supabase
      .from('profiles')
      .select('*')
      .neq('id', userId)
      .eq('pause_mode', false)
      .limit(limit);
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
      .upsert({
        from_user_id: fromUserId,
        to_user_id: toUserId,
        action,
        comment: comment ?? null
      }, { onConflict: 'from_user_id,to_user_id' })
      .select()
      .single();
  }

  getSwipes(fromUserId: string, toUserId: string) {
    return this.supabase
      .from('swipes')
      .select('*')
      .eq('from_user_id', fromUserId)
      .eq('to_user_id', toUserId);
  }

  checkMutualLike(userA: string, userB: string) {
    return this.supabase
      .from('swipes')
      .select('*')
      .eq('from_user_id', userB)
      .eq('to_user_id', userA)
      .eq('action', 'like')
      .maybeSingle();
  }

  createMatch(userA: string, userB: string) {
    const [firstUser, secondUser] = [userA, userB].sort();
    return this.supabase
      .from('matches')
      .upsert({
        user_a: firstUser,
        user_b: secondUser,
        status: 'active'
      }, { onConflict: 'user_a,user_b' })
      .select()
      .single();
  }

  createChat(matchId: string) {
    return this.supabase
      .from('chats')
      .upsert({
        match_id: matchId,
        status: 'active'
      }, { onConflict: 'match_id' })
      .select()
      .single();
  }

  getChatByMatch(matchId: string) {
    return this.supabase
      .from('chats')
      .select('*')
      .eq('match_id', matchId)
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

  getMessages(chatId: string) {
    return this.supabase
      .from('messages')
      .select('*')
      .eq('chat_id', chatId)
      .order('created_at', { ascending: true });
  }

  sendMessage(chatId: string, senderId: string, content: string) {
    return this.supabase
      .from('messages')
      .insert({
        chat_id: chatId,
        sender_id: senderId,
        content
      })
      .select()
      .single();
  }

  subscribeToChat(chatId: string, callback: (payload: any) => void): RealtimeChannel {
    return this.supabase
      .channel(`chat:${chatId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `chat_id=eq.${chatId}`
        },
        callback
      )
      .subscribe();
  }

  unsubscribe(channel: RealtimeChannel) {
    return this.supabase.removeChannel(channel);
  }

  closeMatch(matchId: string) {
    return this.supabase
      .from('matches')
      .update({ status: 'closed' })
      .eq('id', matchId)
      .select()
      .single();
  }

  getBlocksForUser(userId: string) {
    return this.supabase
      .from('blocks')
      .select('*')
      .or(`blocker_id.eq.${userId},blocked_user_id.eq.${userId}`);
  }

  getReportsByUser(userId: string) {
    return this.supabase
      .from('reports')
      .select('*')
      .eq('reporter_id', userId);
  }

  blockUser(blockerId: string, blockedId: string) {
    return this.supabase
      .from('blocks')
      .upsert({
        blocker_id: blockerId,
        blocked_user_id: blockedId
      }, { onConflict: 'blocker_id,blocked_user_id' })
      .select()
      .single();
  }

  reportUser(reporterId: string, reportedId: string, reason: string) {
    return this.supabase
      .from('reports')
      .insert({
        reporter_id: reporterId,
        reported_user_id: reportedId,
        reason
      })
      .select()
      .single();
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
