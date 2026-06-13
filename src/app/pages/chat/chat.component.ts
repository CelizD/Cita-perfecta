import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ChatService } from '../../core/services/chat.service';
import { FriendlyClosureComponent } from '../friendly-closure/friendly-closure.component';

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, FriendlyClosureComponent],
  templateUrl: './chat.component.html',
  styleUrl: './chat.component.scss'
})
export class ChatComponent {
  private route = inject(ActivatedRoute);
  private fb = inject(FormBuilder);
  private chatService = inject(ChatService);

  chatId = Number(this.route.snapshot.paramMap.get('id'));
  showClosure = false;
  icebreaker = this.chatService.getIcebreaker();

  form = this.fb.nonNullable.group({
    text: ['', Validators.required]
  });

  get chat() {
    return this.chatService.findChat(this.chatId);
  }

  send(): void {
    if (this.form.invalid || !this.chat || this.chat.status === 'cerrado') return;
    this.chatService.sendMessage(this.chat.id, this.form.controls.text.value);
    this.form.reset();
  }

  close(reason: string): void {
    if (!this.chat) return;
    this.chatService.closeChat(this.chat.id, reason);
    this.showClosure = false;
  }
}
