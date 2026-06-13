import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { CompatibilityService } from '../../core/services/compatibility.service';
import { Answer } from '../../core/models/question.model';

@Component({
  selector: 'app-compatibility-test',
  standalone: true,
  imports: [],
  templateUrl: './compatibility-test.component.html',
  styleUrl: './compatibility-test.component.scss'
})
export class CompatibilityTestComponent {
  private compatibilityService = inject(CompatibilityService);
  private router = inject(Router);

  currentIndex = 0;
  answers = new Map<number, number>();
  questions = this.compatibilityService.questions;

  constructor() {
    for (const answer of this.compatibilityService.getAnswers()) {
      this.answers.set(answer.questionId, answer.value);
    }
  }

  get currentQuestion() {
    return this.questions[this.currentIndex];
  }

  get progress(): number {
    return Math.round(((this.currentIndex + 1) / this.questions.length) * 100);
  }

  select(value: number): void {
    this.answers.set(this.currentQuestion.id, value);
  }

  next(): void {
    if (!this.answers.has(this.currentQuestion.id)) return;

    if (this.currentIndex < this.questions.length - 1) {
      this.currentIndex++;
      return;
    }

    const finalAnswers: Answer[] = this.questions.map((question) => ({
      questionId: question.id,
      value: this.answers.get(question.id) ?? 3
    }));

    this.compatibilityService.saveAnswers(finalAnswers);
    this.router.navigate(['/aura']);
  }

  previous(): void {
    if (this.currentIndex > 0) this.currentIndex--;
  }
}
