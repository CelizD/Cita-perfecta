import { Injectable, inject } from '@angular/core';
import { SupabaseService } from './supabase.service';

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private supabaseService = inject(SupabaseService);

  async registerToken(token: string, platform: 'ios' | 'android' | 'web' = 'web', deviceName = 'Browser'): Promise<void> {
    const supabase = this.supabaseService.client;
    if (!supabase) throw new Error(this.supabaseService.requiredConfigMessage);

    const {
      data: { user }
    } = await supabase.auth.getUser();

    if (!user) throw new Error('Inicia sesion para registrar notificaciones.');

    const payload = token.startsWith('ExponentPushToken')
      ? { expo_push_token: token, fcm_token: null }
      : { expo_push_token: null, fcm_token: token };

    const { error } = await supabase.from('user_devices').upsert({
      user_id: user.id,
      platform,
      device_name: deviceName,
      is_active: true,
      ...payload
    });

    if (error) throw new Error(error.message);
  }

  async sendMatchNotification(userId: string, matchId: string): Promise<void> {
    await this.invokeNotification('send-match-notification', { userId, matchId });
  }

  async sendMessageNotification(userId: string, chatId: string): Promise<void> {
    await this.invokeNotification('send-message-notification', { userId, chatId });
  }

  private async invokeNotification(functionName: string, body: Record<string, string>): Promise<void> {
    const supabase = this.supabaseService.client;
    if (!supabase) throw new Error(this.supabaseService.requiredConfigMessage);

    const { error } = await supabase.functions.invoke(functionName, { body });
    if (error) throw new Error(error.message);
  }
}
