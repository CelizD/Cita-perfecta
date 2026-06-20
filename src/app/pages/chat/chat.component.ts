import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { RealtimeChannel } from '@supabase/supabase-js';
import { SupabaseService } from '../../services/supabase.service';

interface ChatMessage {
  id: string;
  chat_id: string;
  sender_id: string;
  content: string;
  created_at: string;
}

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './chat.component.html',
  styleUrl: './chat.component.scss'
})
export class ChatComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private fb = inject(FormBuilder);
  private supabase = inject(SupabaseService);

  userId = '';
  matchId = this.route.snapshot.paramMap.get('id') ?? '';
  chatId = '';
  messages: ChatMessage[] = [];
  match: Record<string, any> | null = null;
  loading = false;
  errorMessage = '';
  showClosure = false;
  channel: RealtimeChannel | null = null;

  closureOptions = [
    'Me encanto platicar contigo, pero senti mas una vibra de amistad. Gracias por tu tiempo.',
    'Gracias por conversar conmigo. Prefiero cerrar aqui con respeto y claridad.',
    'Valoro lo que compartimos, pero no siento la conexion que busco. Te deseo algo bonito.'
  ];

  form = this.fb.nonNullable.group({
    text: ['', Validators.required]
  });

  async ngOnInit(): Promise<void> {
    this.loading = true;
    const user = await this.supabase.getCurrentUser();

    if (!user) {
      await this.router.navigate(['/login']);
      return;
    }

    this.userId = user.id;
    await this.prepareChat();
    this.loading = false;
  }

  async ngOnDestroy(): Promise<void> {
    if (this.channel) {
      await this.supabase.unsubscribe(this.channel);
    }
  }

  async send(): Promise<void> {
    this.form.markAllAsTouched();
    if (this.form.invalid || !this.chatId || this.isClosed) return;

    const content = this.form.controls.text.value.trim();
    if (!content) return;

    const { error } = await this.supabase.sendMessage(this.chatId, this.userId, content);
    if (error) {
      this.errorMessage = error.message;
      return;
    }

    this.form.reset();
  }

  async closeWithRespect(message: string): Promise<void> {
    if (!this.chatId || !this.matchId) return;

    this.loading = true;
    await this.supabase.sendMessage(this.chatId, this.userId, message);
    const { error } = await this.supabase.closeMatch(this.matchId);
    this.loading = false;

    if (error) {
      this.errorMessage = error.message;
      return;
    }

    this.match = { ...(this.match ?? {}), status: 'closed' };
    this.showClosure = false;
  }

  get isClosed(): boolean {
    return this.match?.['status'] === 'closed';
  }

  private async prepareChat(): Promise<void> {
    const chat = await this.supabase.createChat(this.matchId);

    if (chat.error) {
      this.errorMessage = chat.error.message;
      return;
    }

    this.chatId = chat.data['id'];
    await this.loadMessages();
    this.subscribe();
  }

  private async loadMessages(): Promise<void> {
    const { data, error } = await this.supabase.getMessages(this.chatId);

    if (error) {
      this.errorMessage = error.message;
      return;
    }

    this.messages = (data ?? []) as ChatMessage[];
  }

  private subscribe(): void {
    this.channel = this.supabase.subscribeToChat(this.chatId, (payload) => {
      const message = payload.new as ChatMessage;
      if (!this.messages.some((item) => item.id === message.id)) {
        this.messages = [...this.messages, message].sort((a, b) => a.created_at.localeCompare(b.created_at));
      }
    });
  }
}
