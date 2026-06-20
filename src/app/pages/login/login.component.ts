import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { SupabaseService } from '../../core/services/supabase.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent implements OnInit {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  public supabaseService = inject(SupabaseService);
  private router = inject(Router);

  message = '';
  loading = false;

  form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required]
  });

  ngOnInit(): void {
    if (this.authService.currentUser()) {
      this.redirectAfterLogin();
    }
  }

  async submit(): Promise<void> {
    this.form.markAllAsTouched();
    if (this.form.invalid || this.loading) return;

    this.loading = true;
    const result = await this.authService.login(this.form.controls.email.value, this.form.controls.password.value);
    this.loading = false;
    this.message = result.message;

    if (result.ok) {
      this.redirectAfterLogin();
    }
  }

  private redirectAfterLogin(): void {
    const user = this.authService.currentUser();
    if (!user?.pactAccepted) this.router.navigate(['/pacto-respeto']);
    else if (!user.profileComplete) this.router.navigate(['/onboarding']);
    else if (!user.testComplete) this.router.navigate(['/test']);
    else this.router.navigate(['/matches']);
  }
}
