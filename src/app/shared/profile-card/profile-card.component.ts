import { Component, EventEmitter, Input, Output } from '@angular/core';
import { PublicProfile } from '../../core/models/user.model';

@Component({
  selector: 'app-profile-card',
  standalone: true,
  imports: [],
  templateUrl: './profile-card.component.html',
  styleUrl: './profile-card.component.scss'
})
export class ProfileCardComponent {
  @Input({ required: true }) profile!: PublicProfile;
  @Output() viewClicked = new EventEmitter<PublicProfile>();
  @Output() likeClicked = new EventEmitter<PublicProfile>();
  @Output() letterClicked = new EventEmitter<PublicProfile>();

  get initials(): string {
    return this.profile.name.slice(0, 2).toUpperCase();
  }

  notifyLike(): void {
    this.likeClicked.emit(this.profile);
  }

  notifyView(): void {
    this.viewClicked.emit(this.profile);
  }

  notifyLetter(): void {
    this.letterClicked.emit(this.profile);
  }
}
