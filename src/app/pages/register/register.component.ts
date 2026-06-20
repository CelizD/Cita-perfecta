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
    const { email, password } = this.form.getRawValue();
    const { data, error } = await this.supabase.signUp(email, password);
    this.loading = false;

    if (error) {
      this.errorMessage = error.message;
      return;
    }

    if (data.session) {
      await this.router.navigate(['/profile']);
      return;
    }

    this.successMessage = 'Cuenta creada. Revisa tu correo para verificar tu cuenta antes de iniciar sesion.';
  }

  private passwordsMatchValidator(control: AbstractControl): ValidationErrors | null {
    const password = control.get('password')?.value;
    const confirmPassword = control.get('confirmPassword')?.value;

    if (!password || !confirmPassword) return null;
    return password === confirmPassword ? null : { passwordsMismatch: true };
  }
}
