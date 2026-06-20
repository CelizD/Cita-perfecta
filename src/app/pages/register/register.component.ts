import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { SupabaseService } from '../../services/supabase.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss'
})
export class RegisterComponent {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private supabase = inject(SupabaseService);

  loading = false;
  errorMessage = '';
  successMessage = '';

  form = this.fb.nonNullable.group(
    {
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]]
    },
    { validators: this.passwordsMatchValidator }
  );

  async submit(): Promise<void> {
    this.form.markAllAsTouched();
    this.errorMessage = '';
    this.successMessage = '';

    if (this.form.invalid || this.loading) return;

    this.loading = true;

    try {
      const { email, password } = this.form.getRawValue();
      const { data, error } = await this.withTimeout(
        this.supabase.signUp(email, password),
        'Supabase tardo demasiado en responder. Revisa el trigger de profiles o intenta de nuevo.'
      );

      if (error) {
        this.errorMessage = error.message;
        return;
      }

      if (data.session) {
        await this.router.navigate(['/profile']);
        return;
      }

      this.successMessage = 'Cuenta creada. Revisa tu correo para verificar tu cuenta antes de iniciar sesion.';
    } catch (error) {
      this.errorMessage = error instanceof Error ? error.message : 'No se pudo crear la cuenta.';
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

  private passwordsMatchValidator(control: AbstractControl): ValidationErrors | null {
    const password = control.get('password')?.value;
    const confirmPassword = control.get('confirmPassword')?.value;

    if (!password || !confirmPassword) return null;
    return password === confirmPassword ? null : { passwordsMismatch: true };
  }
}
