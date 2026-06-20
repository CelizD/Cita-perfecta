import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { SupabaseService } from '../../services/supabase.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private supabase = inject(SupabaseService);

  loading = false;
  errorMessage = '';

  form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]]
  });

  async submit(): Promise<void> {
    this.form.markAllAsTouched();
    this.errorMessage = '';

    if (this.form.invalid || this.loading) return;

    this.loading = true;

    try {
      const { email, password } = this.form.getRawValue();
      const { error } = await this.withTimeout(
        this.supabase.signIn(email, password),
        'Supabase tardo demasiado en responder. Intenta de nuevo.'
      );

      if (error) {
        this.errorMessage = error.message;
        return;
      }

      await this.router.navigate(['/dashboard']);
    } catch (error) {
      this.errorMessage = error instanceof Error ? error.message : 'No se pudo iniciar sesion.';
    } finally {
      this.loading = false;
    }
  }

  private withTimeout(promise: Promise<any>, message: string, ms = 15000): Promise<any> {
    return Promise.race([
      promise,
      new Promise<any>((_, reject) => {
        setTimeout(() => reject(new Error(message)), ms);
      })
    ]);
  }
}
