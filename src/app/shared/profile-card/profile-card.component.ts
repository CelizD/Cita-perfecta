import { Component, EventEmitter, Input, Output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PublicProfile } from '../../core/models/user.model';

@Component({
  selector: 'app-profile-card',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './profile-card.component.html',
  styleUrl: './profile-card.component.scss'
})
export class ProfileCardComponent {
  @Input({ required: true }) profile!: PublicProfile;
  @Output() likeClicked = new EventEmitter<PublicProfile>();
  @Output() letterClicked = new EventEmitter<PublicProfile>();

  get initials(): string {
    return this.profile.name.slice(0, 2).toUpperCase();
  }

  notifyLike(): void {
    this.likeClicked.emit(this.profile);
  }

  notifyLetter(): void {
    this.letterClicked.emit(this.profile);
  }
}
