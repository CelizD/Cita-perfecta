import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, ElementRef, OnDestroy, OnInit, ViewChild, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { RealtimeChannel } from '@supabase/supabase-js';
import { ChatMessage, ChatService } from '../../services/chat.service';
import { MatchService } from '../../services/match.service';
import { SupabaseService } from '../../services/supabase.service';

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './chat.component.html',
  styleUrl: './chat.component.scss'
})
export class ChatComponent implements OnInit, OnDestroy {
  @ViewChild('messageWindow') messageWindow?: ElementRef<HTMLDivElement>;

  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private fb = inject(FormBuilder);
  private cdr = inject(ChangeDetectorRef);
  private supabase = inject(SupabaseService);
  private matchService = inject(MatchService);
  private chatService = inject(ChatService);

  userId = '';
  matchId = this.route.snapshot.paramMap.get('matchId') ?? this.route.snapshot.paramMap.get('id') ?? '';
  chatId = '';
  messages: ChatMessage[] = [];
  match: any = null;
  otherProfile: any = null;
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
      await this.chatService.unsubscribe(this.channel);
    }
  }

  async send(): Promise<void> {
    this.form.markAllAsTouched();
    if (this.form.invalid || !this.chatId || this.isClosed) return;

    const content = this.form.controls.text.value.trim();
    if (!content) return;

    try {
      await this.chatService.sendMessage(this.chatId, this.userId, content);
      this.form.reset();
      this.scrollToBottomSoon();
    } catch (error) {
      this.errorMessage = error instanceof Error ? error.message : 'No se pudo enviar el mensaje.';
    }
  }

  async closeWithRespect(message: string): Promise<void> {
    if (!this.chatId || !this.matchId) return;

    this.loading = true;

    try {
      await this.chatService.sendMessage(this.chatId, this.userId, message);
      await this.supabase.closeMatch(this.matchId);
      this.match = { ...(this.match ?? {}), status: 'closed' };
      this.showClosure = false;
    } catch (error) {
      this.errorMessage = error instanceof Error ? error.message : 'No se pudo cerrar la conversacion.';
    } finally {
      this.loading = false;
    }
  }

  get isClosed(): boolean {
    return this.match?.status === 'closed';
  }

  profileName(): string {
    return this.otherProfile?.name ?? 'Match';
  }

  private async prepareChat(): Promise<void> {
    try {
      this.match = await this.matchService.getMatch(this.matchId);
      this.otherProfile = this.match.user_a === this.userId ? this.match.user_b_profile : this.match.user_a_profile;

      const chat = await this.chatService.getChatByMatch(this.matchId);
      this.chatId = chat['id'];
      this.messages = await this.chatService.getMessages(this.chatId);
      await this.chatService.markAsRead(this.chatId, this.userId);
      this.subscribe();
      this.scrollToBottomSoon();
    } catch (error) {
      this.errorMessage = error instanceof Error ? error.message : 'No se pudo cargar el chat.';
    }
  }

  private subscribe(): void {
    this.channel = this.chatService.subscribeToChat(this.chatId, (message) => {
      if (!this.messages.some((item) => item.id === message.id)) {
        this.messages = [...this.messages, message].sort((a, b) => a.created_at.localeCompare(b.created_at));
      }

      this.cdr.detectChanges();
      this.scrollToBottomSoon();
    });
  }

  private scrollToBottomSoon(): void {
    setTimeout(() => {
      const element = this.messageWindow?.nativeElement;
      if (element) {
        element.scrollTop = element.scrollHeight;
      }
    });
  }
}
