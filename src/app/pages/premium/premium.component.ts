import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PremiumService } from '../../core/services/premium.service';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-premium',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './premium.component.html',
  styleUrl: './premium.component.scss'
})
export class PremiumComponent {
  constructor(
    public premiumService: PremiumService,
    public authService: AuthService
  ) {}
}
