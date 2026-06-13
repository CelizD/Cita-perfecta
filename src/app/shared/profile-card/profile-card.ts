import { Component, EventEmitter, Input, Output } from '@angular/core';
import { UserProfile } from '../../models/user-profile.model';

@Component({
  selector: 'app-profile-card',
  standalone: false,
  templateUrl: './profile-card.component.html',
  styleUrl: './profile-card.component.scss'
})
export class ProfileCardComponent {
  @Input() profile!: UserProfile;
  @Output() likeClicked = new EventEmitter<UserProfile>();
  @Output() letterClicked = new EventEmitter<UserProfile>();

  sendLike(): void {
    this.likeClicked.emit(this.profile);
  }

  sendLetter(): void {
    this.letterClicked.emit(this.profile);
  }
}