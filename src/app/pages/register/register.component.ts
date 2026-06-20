import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { SupabaseService } from '../../core/services/supabase.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss'
})
export class RegisterComponent implements OnInit {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  public supabaseService = inject(SupabaseService);
  private router = inject(Router);

  message = '';
  loading = false;

  form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(3)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    birthDate: ['', Validators.required],
    terms: [false, Validators.requiredTrue]
  });

  ngOnInit(): void {
    if (this.authService.currentUser()) {
      this.router.navigate(['/matches']);
    }
  }

  async submit(): Promise<void> {
    this.form.markAllAsTouched();
    if (this.form.invalid || this.loading) return;

    this.loading = true;
    const result = await this.authService.register({
      name: this.form.controls.name.value,
      email: this.form.controls.email.value,
      password: this.form.controls.password.value,
      birthDate: this.form.controls.birthDate.value
    });
    this.loading = false;

    this.message = result.message;
    if (result.ok) {
      if (this.authService.currentUser()) {
        this.router.navigate(['/pacto-respeto']);
      } else {
        this.router.navigate(['/login']);
      }
    }
  }
}
