import { Component } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { UserService } from '../../core/services/user.service';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.scss'
})
export class SettingsComponent {
  constructor(
    public authService: AuthService,
    private userService: UserService,
    private router: Router
  ) {}

  togglePause(): void {
    this.userService.togglePauseMode();
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/inicio']);
  }
}
