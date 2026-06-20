import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Question, SupabaseService } from '../../services/supabase.service';

interface AuraResult {
  title: string;
  phrase: string;
}

@Component({
  selector: 'app-onboarding',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './onboarding.component.html',
  styleUrl: './onboarding.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class OnboardingComponent implements OnInit {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private supabase = inject(SupabaseService);
  private cdr = inject(ChangeDetectorRef);

  step = 0;
  loading = false;
  errorMessage = '';
  acceptedRespectPact = false;
  userId = '';
  questions: Question[] = [];
  answers: Record<number, number> = {};
  aura: AuraResult | null = null;

  basicForm = this.fb.nonNullable.group({
    fullName: ['', [Validators.required, Validators.minLength(2)]],
    birthDate: ['', Validators.required],
    city: ['', [Validators.required, Validators.minLength(2)]]
  });

  async ngOnInit(): Promise<void> {
    this.loading = true;
    const user = await this.supabase.getCurrentUser();

    if (!user) {
      await this.router.navigate(['/login']);
      return;
    }

    this.userId = user.id;
    await this.loadProfile();
    this.loading = false;
  }

  continueFromPact(): void {
    if (!this.acceptedRespectPact) return;
    this.step = 1;
    this.scrollTop();
  }

  async saveBasicData(): Promise<void> {
    this.basicForm.markAllAsTouched();
    this.errorMessage = '';

    if (this.basicForm.invalid || this.loading) return;

    this.loading = true;
    const value = this.basicForm.getRawValue();

    const { error } = await this.supabase.updateProfile(this.userId, {
      full_name: value.fullName,
      birth_date: value.birthDate,
      city: value.city,
      pact_accepted: true
    });

    if (error) {
      this.loading = false;
      this.errorMessage = error.message;
      return;
    }

    await this.loadQuestions();
    this.step = 2;
    this.loading = false;
    this.scrollTop();
    this.cdr.markForCheck();
  }

  setAnswer(questionId: number, value: number): void {
    this.answers[questionId] = value;
  }

  async saveTestAndShowAura(): Promise<void> {
    this.errorMessage = '';

    if (this.questions.some((question) => !this.answers[question.id])) {
      this.errorMessage = 'Responde todas las preguntas para calcular tu Aura.';
      return;
    }

    this.loading = true;
    const rows = this.questions.map((question) => ({
      question_id: question.id,
      value: this.answers[question.id]
    }));

    const { error } = await this.supabase.saveAnswers(this.userId, rows);
    this.loading = false;

    if (error) {
      this.errorMessage = error.message;
      return;
    }

    this.aura = this.calculateAura();
    this.step = 3;
    this.scrollTop();
    this.cdr.markForCheck();
  }

  async finishOnboarding(): Promise<void> {
    this.errorMessage = '';
    this.loading = true;
    const { error } = await this.supabase.updateOnboardingStatus(this.userId);
    this.loading = false;

    if (error) {
      this.errorMessage = error.message;
      return;
    }

    await this.router.navigate(['/explore']);
  }

  get progressLabel(): string {
    return `${Math.min(this.step + 1, 4)} de 4`;
  }

  get progressPercentage(): number {
    return ((this.step + 1) / 4) * 100;
  }

  private async loadProfile(): Promise<void> {
    const { data } = await this.supabase.getProfile(this.userId);
    if (!data) return;

    this.acceptedRespectPact = Boolean(data['pact_accepted']);
    this.basicForm.patchValue({
      fullName: String(data['full_name'] ?? ''),
      birthDate: String(data['birth_date'] ?? ''),
      city: String(data['city'] ?? '')
    });
    this.cdr.markForCheck();
  }

  private async loadQuestions(): Promise<void> {
    const { data, error } = await this.supabase.getInitialQuestions();

    if (error) {
      this.errorMessage = error.message;
      this.questions = [];
      return;
    }

    this.questions = ((data ?? []) as Question[]).slice(0, 15);
    this.answers = this.questions.reduce<Record<number, number>>((acc, question) => {
      acc[question.id] = 3;
      return acc;
    }, {});
    this.cdr.markForCheck();
  }

  private scrollTop(): void {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  private calculateAura(): AuraResult {
    const values = Object.values(this.answers);
    const average = values.reduce((sum, value) => sum + value, 0) / values.length;

    if (average > 4) {
      return {
        title: 'Romantico Profundo',
        phrase: 'Conectas mejor con personas que valoran la entrega emocional y la honestidad.'
      };
    }

    if (average > 3.5) {
      return {
        title: 'Empatico Tranquilo',
        phrase: 'Conectas mejor con personas que valoran la calma, la paciencia y el cuidado mutuo.'
      };
    }

    if (average > 2.5) {
      return {
        title: 'Explorador Leal',
        phrase: 'Conectas mejor con personas que combinan curiosidad, respeto y estabilidad.'
      };
    }

    if (average > 2) {
      return {
        title: 'Comunicador Claro',
        phrase: 'Conectas mejor con personas que hablan directo y construyen acuerdos sanos.'
      };
    }

    return {
      title: 'Protector',
      phrase: 'Conectas mejor con personas que respetan tus limites y avanzan sin presion.'
    };
  }
}
