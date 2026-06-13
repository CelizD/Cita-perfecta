import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ChatService } from '../../core/services/chat.service';

@Component({
  selector: 'app-chat-list',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './chat-list.component.html',
  styleUrl: './chat-list.component.scss'
})
export class ChatListComponent {
  constructor(private chatService: ChatService) {}

  get chats() {
    return this.chatService.getChats();
  }
}
