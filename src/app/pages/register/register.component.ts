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
  cooldownSeconds = 0;
  private cooldownTimer: ReturnType<typeof setInterval> | null = null;

  form = this.fb.nonNullable.group(
    {
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8), this.strongPasswordValidator]],
      confirmPassword: ['', [Validators.required]]
    },
    { validators: this.passwordsMatchValidator }
  );

  async submit(): Promise<void> {
    this.form.markAllAsTouched();
    this.errorMessage = '';
    this.successMessage = '';

    if (this.form.invalid || this.loading || this.cooldownSeconds > 0) return;

    this.loading = true;

    try {
      const { email, password } = this.form.getRawValue();
      const { data, error } = await this.withTimeout(
        this.supabase.signUp(email, password),
        'Supabase tardo demasiado en responder. Revisa el trigger de profiles o intenta de nuevo.'
      );

      if (error) {
        this.errorMessage = this.translateSignUpError(error);
        return;
      }

      if (data.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) {
        this.errorMessage = 'Este correo ya esta registrado. Inicia sesion o usa recuperar contrasena.';
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

  get submitLabel(): string {
    if (this.loading) return 'Creando cuenta...';
    if (this.cooldownSeconds > 0) return `Espera ${this.cooldownSeconds}s`;
    return 'Crear cuenta';
  }

  private withTimeout(promise: Promise<any>, message: string, ms = 15000): Promise<any> {
    return Promise.race([
      promise,
      new Promise<any>((_, reject) => {
        setTimeout(() => reject(new Error(message)), ms);
      })
    ]);
  }

  private strongPasswordValidator(control: AbstractControl): ValidationErrors | null {
    const value = String(control.value ?? '');
    if (!value) return null;

    const hasUppercase = /[A-Z]/.test(value);
    const hasLowercase = /[a-z]/.test(value);
    const hasNumber = /\d/.test(value);

    return hasUppercase && hasLowercase && hasNumber ? null : { weakPassword: true };
  }

  private translateSignUpError(error: any): string {
    const message = String(error?.message ?? error ?? '');
    const status = Number(error?.status ?? 0);
    const normalized = message.toLowerCase();

    if (
      status === 429 ||
      normalized.includes('rate limit') ||
      normalized.includes('too many') ||
      normalized.includes('security purposes')
    ) {
      this.startCooldown(60);
      return 'Supabase bloqueo temporalmente los registros por demasiados intentos. Espera 1 minuto y prueba con un correo nuevo.';
    }

    if (
      normalized.includes('already registered') ||
      normalized.includes('already been registered') ||
      normalized.includes('user already registered')
    ) {
      return 'Este correo ya esta registrado. Inicia sesion o usa recuperar contrasena.';
    }

    if (normalized.includes('password')) {
      return 'La contrasena debe tener minimo 8 caracteres, una mayuscula, una minuscula y un numero.';
    }

    if (normalized.includes('email') || normalized.includes('invalid')) {
      return 'Revisa que el correo sea valido. Si ya existe, intenta iniciar sesion.';
    }

    if (normalized.includes('database') || normalized.includes('profile')) {
      return 'Supabase no pudo crear el perfil. Ejecuta la migracion fix_signup_profile_trigger.sql en Supabase.';
    }

    return `No se pudo crear la cuenta: ${message}`;
  }

  private startCooldown(seconds: number): void {
    this.cooldownSeconds = seconds;

    if (this.cooldownTimer) {
      clearInterval(this.cooldownTimer);
    }

    this.cooldownTimer = setInterval(() => {
      this.cooldownSeconds = Math.max(this.cooldownSeconds - 1, 0);

      if (this.cooldownSeconds === 0 && this.cooldownTimer) {
        clearInterval(this.cooldownTimer);
        this.cooldownTimer = null;
      }
    }, 1000);
  }

  private passwordsMatchValidator(control: AbstractControl): ValidationErrors | null {
    const password = control.get('password')?.value;
    const confirmPassword = control.get('confirmPassword')?.value;

    if (!password || !confirmPassword) return null;
    return password === confirmPassword ? null : { passwordsMismatch: true };
  }
}
