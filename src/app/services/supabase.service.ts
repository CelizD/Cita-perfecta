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
  private supabase: SupabaseClient | null = null;
  readonly isConfigured = this.isValidSupabaseConfig();
  readonly configMessage = 'Configura Supabase en src/environments/environment.ts con una URL https://...supabase.co y tu anon public key.';

  constructor() {
    if (!this.isConfigured) return;

    this.supabase = createClient(environment.supabase.url, environment.supabase.anonKey, {
      auth: {
        autoRefreshToken: true,
        detectSessionInUrl: true,
        persistSession: true
      }
    });
  }

  signUp(email: string, password: string) {
    const supabase = this.requireClient();
    if (!supabase) return Promise.resolve(this.notConfiguredResponse());

    return supabase.auth.signUp({
      email,
      password
    });
  }

  signIn(email: string, password: string) {
    const supabase = this.requireClient();
    if (!supabase) return Promise.resolve(this.notConfiguredResponse());

    return supabase.auth.signInWithPassword({
      email,
      password
    });
  }

  signOut() {
    const supabase = this.requireClient();
    if (!supabase) return Promise.resolve(this.notConfiguredResponse());

    return supabase.auth.signOut();
  }

  async getCurrentUser(): Promise<User | null> {
    const supabase = this.requireClient();
    if (!supabase) return null;

    const { data, error } = await supabase.auth.getUser();
    if (error) return null;
    return data.user;
  }

  getProfile(userId: string) {
    const supabase = this.requireClient();
    if (!supabase) return Promise.resolve(this.notConfiguredResponse());

    return supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
  }

  getProfilesForCompatibility(userId: string, limit = 50) {
    const supabase = this.requireClient();
    if (!supabase) return Promise.resolve(this.notConfiguredResponse([]));

    return supabase
      .from('profiles')
      .select('*')
      .neq('id', userId)
      .eq('pause_mode', false)
      .limit(limit);
  }

  createProfile(userId: string, data: any) {
    const supabase = this.requireClient();
    if (!supabase) return Promise.resolve(this.notConfiguredResponse());

    return supabase
      .from('profiles')
      .insert({
        id: userId,
        ...data
      })
      .select()
      .single();
  }

  updateProfile(userId: string, data: any) {
    const supabase = this.requireClient();
    if (!supabase) return Promise.resolve(this.notConfiguredResponse());

    return supabase
      .from('profiles')
      .update(data)
      .eq('id', userId)
      .select()
      .single();
  }

  async getInitialQuestions() {
    const supabase = this.requireClient();
    if (!supabase) return this.notConfiguredResponse([]);

    return supabase
      .from('questions')
      .select('*')
      .eq('is_initial', true)
      .eq('is_active', true)
      .order('id', { ascending: true })
      .limit(15);
  }

  async saveAnswers(userId: string, answers: { question_id: number; value: number }[]) {
    const supabase = this.requireClient();
    if (!supabase) return this.notConfiguredResponse();

    const { error: deleteError } = await supabase
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

    return supabase
      .from('answers')
      .insert(rows)
      .select();
  }

  getAnswers(userId: string) {
    const supabase = this.requireClient();
    if (!supabase) return Promise.resolve(this.notConfiguredResponse([]));

    return supabase
      .from('answers')
      .select('question_id, value')
      .eq('user_id', userId)
      .order('question_id', { ascending: true });
  }

  sendSwipe(fromUserId: string, toUserId: string, action: 'like' | 'pass', comment?: string) {
    const supabase = this.requireClient();
    if (!supabase) return Promise.resolve(this.notConfiguredResponse());

    return supabase
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
    const supabase = this.requireClient();
    if (!supabase) return Promise.resolve(this.notConfiguredResponse([]));

    return supabase
      .from('swipes')
      .select('*')
      .eq('from_user_id', fromUserId)
      .eq('to_user_id', toUserId);
  }

  checkMutualLike(userA: string, userB: string) {
    const supabase = this.requireClient();
    if (!supabase) return Promise.resolve(this.notConfiguredResponse());

    return supabase
      .from('swipes')
      .select('*')
      .eq('from_user_id', userB)
      .eq('to_user_id', userA)
      .eq('action', 'like')
      .maybeSingle();
  }

  createMatch(userA: string, userB: string) {
    const supabase = this.requireClient();
    if (!supabase) return Promise.resolve(this.notConfiguredResponse());

    const [firstUser, secondUser] = [userA, userB].sort();
    return supabase
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
    const supabase = this.requireClient();
    if (!supabase) return Promise.resolve(this.notConfiguredResponse());

    return supabase
      .from('chats')
      .upsert({
        match_id: matchId,
        status: 'active'
      }, { onConflict: 'match_id' })
      .select()
      .single();
  }

  getChatByMatch(matchId: string) {
    const supabase = this.requireClient();
    if (!supabase) return Promise.resolve(this.notConfiguredResponse());

    return supabase
      .from('chats')
      .select('*')
      .eq('match_id', matchId)
      .single();
  }

  getMatches(userId: string) {
    const supabase = this.requireClient();
    if (!supabase) return Promise.resolve(this.notConfiguredResponse([]));

    return supabase
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
    const supabase = this.requireClient();
    if (!supabase) return Promise.resolve(this.notConfiguredResponse([]));

    return supabase
      .from('messages')
      .select('*')
      .eq('chat_id', chatId)
      .order('created_at', { ascending: true });
  }

  sendMessage(chatId: string, senderId: string, content: string) {
    const supabase = this.requireClient();
    if (!supabase) return Promise.resolve(this.notConfiguredResponse());

    return supabase
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
    const supabase = this.requireClient();
    if (!supabase) {
      throw new Error(this.configMessage);
    }

    return supabase
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
    const supabase = this.requireClient();
    if (!supabase) return Promise.resolve('ok');

    return supabase.removeChannel(channel);
  }

  closeMatch(matchId: string) {
    const supabase = this.requireClient();
    if (!supabase) return Promise.resolve(this.notConfiguredResponse());

    return supabase
      .from('matches')
      .update({ status: 'closed' })
      .eq('id', matchId)
      .select()
      .single();
  }

  getBlocksForUser(userId: string) {
    const supabase = this.requireClient();
    if (!supabase) return Promise.resolve(this.notConfiguredResponse([]));

    return supabase
      .from('blocks')
      .select('*')
      .or(`blocker_id.eq.${userId},blocked_user_id.eq.${userId}`);
  }

  getReportsByUser(userId: string) {
    const supabase = this.requireClient();
    if (!supabase) return Promise.resolve(this.notConfiguredResponse([]));

    return supabase
      .from('reports')
      .select('*')
      .eq('reporter_id', userId);
  }

  blockUser(blockerId: string, blockedId: string) {
    const supabase = this.requireClient();
    if (!supabase) return Promise.resolve(this.notConfiguredResponse());

    return supabase
      .from('blocks')
      .upsert({
        blocker_id: blockerId,
        blocked_user_id: blockedId
      }, { onConflict: 'blocker_id,blocked_user_id' })
      .select()
      .single();
  }

  reportUser(reporterId: string, reportedId: string, reason: string) {
    const supabase = this.requireClient();
    if (!supabase) return Promise.resolve(this.notConfiguredResponse());

    return supabase
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
    const supabase = this.requireClient();
    if (!supabase) return Promise.resolve(this.notConfiguredResponse());

    return supabase
      .from('profiles')
      .update({ is_onboarded: true })
      .eq('id', userId)
      .select()
      .single();
  }

  private requireClient(): SupabaseClient | null {
    return this.supabase;
  }

  private isValidSupabaseConfig(): boolean {
    const url = environment.supabase.url;
    const anonKey = environment.supabase.anonKey;

    if (!url || !anonKey || url === 'TU_URL_AQUI' || anonKey === 'TU_ANON_KEY_AQUI') {
      return false;
    }

    try {
      const parsed = new URL(url);
      return parsed.protocol === 'http:' || parsed.protocol === 'https:';
    } catch {
      return false;
    }
  }

  private notConfiguredResponse(data: unknown = null) {
    return {
      data,
      error: {
        message: this.configMessage
      }
    };
  }
}
