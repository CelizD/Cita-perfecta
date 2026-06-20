import { Injectable } from '@angular/core';
import { RealtimeChannel, SupabaseClient, User } from '@supabase/supabase-js';
import { getSupabaseClient, isSupabaseConfigured } from '../core/services/supabase-client';

// H-010: valida que un string sea un UUID v4 antes de interpolarlo en filtros PostgREST
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
function assertUuid(value: string, field = 'id'): string {
  if (!UUID_RE.test(value)) throw new Error(`Invalid UUID for field ${field}: ${value}`);
  return value;
}

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
  private supabase: SupabaseClient | null = getSupabaseClient();
  readonly isConfigured = isSupabaseConfigured();
  readonly configMessage = 'Configura Supabase en src/environments/environment.ts con una URL https://...supabase.co y tu anon public key.';
  get requiredConfigMessage(): string { return this.configMessage; }
  get client(): SupabaseClient | null { return this.supabase; }

  signUp(email: string, password: string) {
    const supabase = this.requireClient();
    if (!supabase) return Promise.resolve(this.notConfiguredResponse());

    const normalizedEmail = email.trim().toLowerCase();
    return supabase.auth.signUp({
      email: normalizedEmail,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/login`,
        data: {
          name: normalizedEmail.split('@')[0]
        }
      }
    });
  }

  signIn(email: string, password: string) {
    const supabase = this.requireClient();
    if (!supabase) return Promise.resolve(this.notConfiguredResponse());

    return supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
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

  // Lee la sesión desde localStorage sin hacer llamada HTTP al servidor de Auth.
  // Usar en guards para evitar bloqueos de red en el arranque.
  // Timeout de 4 s: si getSession() se cuelga (token refresh en red lenta),
  // el guard recibe null y redirige a /login en lugar de quedar colgado.
  async getLocalSession(): Promise<User | null> {
    const supabase = this.requireClient();
    if (!supabase) return null;

    const timeout = new Promise<null>((resolve) => setTimeout(() => resolve(null), 4000));
    const sessionCall = supabase.auth.getSession().then(({ data }) => data.session?.user ?? null);

    return Promise.race([sessionCall, timeout]);
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
      .from('public_profiles')
      .select('*')
      .neq('user_id', userId)
      .limit(limit);
  }

  async getExploreProfiles(excludedUserIds: string[], from: number, to: number) {
    const supabase = this.requireClient();
    if (!supabase) return this.notConfiguredResponse([]);

    // H-010: validar UUIDs antes de interpolar en filtro PostgREST
    const safeExcluded = excludedUserIds.filter((id) => UUID_RE.test(id));

    let query = supabase
      .from('public_profiles')
      .select('id, user_id, name, age, city, main_photo_url, main_photo_path, bio')
      .range(from, to);

    if (safeExcluded.length > 0) {
      query = query.not('user_id', 'in', `(${safeExcluded.join(',')})`);
    }

    const { data, error } = await query;
    if (error) return { data: null, error };

    return {
      data: await this.withSignedProfilePhotoUrls((data ?? []) as Record<string, unknown>[]),
      error: null
    };
  }

  async getPublicProfilesByUserIds(userIds: string[]) {
    const supabase = this.requireClient();
    if (!supabase) return this.notConfiguredResponse([]);
    if (userIds.length === 0) return { data: [], error: null };

    const { data, error } = await supabase
      .from('public_profiles')
      .select('id, user_id, name, age, city, main_photo_url, main_photo_path, bio')
      .in('user_id', userIds);

    if (error) return { data: null, error };

    return {
      data: await this.withSignedProfilePhotoUrls((data ?? []) as Record<string, unknown>[]),
      error: null
    };
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

  getSwipesFromUser(fromUserId: string) {
    const supabase = this.requireClient();
    if (!supabase) return Promise.resolve(this.notConfiguredResponse([]));

    return supabase
      .from('swipes')
      .select('*')
      .eq('from_user_id', fromUserId);
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
        status: 'active',
        expires_at: new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString()
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
      .select('*')
      .or(`user_a.eq.${assertUuid(userId, 'userId')},user_b.eq.${userId}`)
      .order('created_at', { ascending: false });
  }

  getMatch(matchId: string) {
    const supabase = this.requireClient();
    if (!supabase) return Promise.resolve(this.notConfiguredResponse());

    return supabase
      .from('matches')
      .select('*')
      .eq('id', matchId)
      .single();
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

  markMessagesAsRead(chatId: string, userId: string) {
    const supabase = this.requireClient();
    if (!supabase) return Promise.resolve(this.notConfiguredResponse([]));

    return supabase
      .from('messages')
      .update({ read_at: new Date().toISOString() })
      .eq('chat_id', chatId)
      .neq('sender_id', userId)
      .is('read_at', null);
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
      .or(`blocker_id.eq.${assertUuid(userId, 'userId')},blocked_user_id.eq.${userId}`);
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

  private async withSignedProfilePhotoUrls(rows: Record<string, unknown>[]): Promise<Record<string, unknown>[]> {
    const supabase = this.requireClient();
    if (!supabase) return rows;

    return Promise.all(
      rows.map(async (row) => {
        const path = typeof row['main_photo_path'] === 'string' ? row['main_photo_path'] : '';
        if (!path) return row;

        const { data, error } = await supabase.storage
          .from('profile-photos')
          .createSignedUrl(path, 60 * 60);

        if (error || !data?.signedUrl) return row;
        return { ...row, main_photo_url: data.signedUrl };
      })
    );
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
