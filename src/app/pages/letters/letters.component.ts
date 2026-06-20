import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { LetterQuota, LetterService } from '../../core/services/letter.service';

@Component({
  selector: 'app-letters',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './letters.component.html',
  styleUrl: './letters.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LettersComponent implements OnInit {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private letterService = inject(LetterService);

  letters = signal<any[]>([]);
  quota = signal<LetterQuota | null>(null);
  loading = signal(false);
  sending = signal(false);
  errorMessage = signal('');
  successMessage = signal('');

  form = this.fb.nonNullable.group({
    toUserId: ['', Validators.required],
    content: ['', [Validators.required, Validators.minLength(300)]]
  });

  async ngOnInit(): Promise<void> {
    await this.loadLetters();
  }

  async loadLetters(): Promise<void> {
    const user = this.authService.currentUser();
    if (!user || typeof user.id !== 'string') return;

    this.loading.set(true);
    this.clearMessages();

    try {
      const [letters, quota] = await Promise.all([
        this.letterService.getLetters(user.id),
        this.letterService.getQuota(user.id)
      ]);
      this.letters.set(letters);
      this.quota.set(quota);
    } catch (error) {
      this.errorMessage.set(error instanceof Error ? error.message : 'No se pudieron cargar las cartas.');
    } finally {
      this.loading.set(false);
    }
  }

  async sendLetter(): Promise<void> {
    const user = this.authService.currentUser();
    if (!user || typeof user.id !== 'string' || this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.sending.set(true);
    this.clearMessages();

    try {
      const value = this.form.getRawValue();
      await this.letterService.sendLetter(user.id, value.toUserId.trim(), value.content);
      this.form.reset();
      this.successMessage.set('Carta enviada correctamente.');
      await this.loadLetters();
    } catch (error) {
      this.errorMessage.set(error instanceof Error ? error.message : 'No se pudo enviar la carta.');
    } finally {
      this.sending.set(false);
    }
  }

  async markAsRead(letterId: string): Promise<void> {
    try {
      await this.letterService.markLetterAsRead(letterId);
      await this.loadLetters();
    } catch (error) {
      this.errorMessage.set(error instanceof Error ? error.message : 'No se pudo marcar como leida.');
    }
  }

  remainingCharacters(): number {
    return Math.max(300 - this.form.controls.content.value.length, 0);
  }

  private clearMessages(): void {
    this.errorMessage.set('');
    this.successMessage.set('');
  }
}
