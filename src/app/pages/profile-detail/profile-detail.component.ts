import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CompatibilityService } from '../../core/services/compatibility.service';
import { MatchService } from '../../core/services/match.service';
import { ChatService } from '../../core/services/chat.service';
import { ReportService } from '../../core/services/report.service';

@Component({
  selector: 'app-profile-detail',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './profile-detail.component.html',
  styleUrl: './profile-detail.component.scss'
})
export class ProfileDetailComponent {
  private route = inject(ActivatedRoute);
  private fb = inject(FormBuilder);
  private compatibilityService = inject(CompatibilityService);
  private matchService = inject(MatchService);
  private chatService = inject(ChatService);
  private reportService = inject(ReportService);
  private router = inject(Router);

  profile = this.compatibilityService.findProfile(Number(this.route.snapshot.paramMap.get('id')));
  message = '';

  likeForm = this.fb.nonNullable.group({
    comment: ['']
  });

  letterForm = this.fb.nonNullable.group({
    letter: ['', [Validators.required, Validators.minLength(15)]]
  });

  reportForm = this.fb.nonNullable.group({
    reason: ['Comportamiento inapropiado', Validators.required],
    description: ['']
  });

  sendLike(): void {
    if (!this.profile) return;

    const match = this.matchService.sendLike(
      this.profile.id,
      this.profile.name,
      this.profile.compatibility ?? 80,
      this.likeForm.controls.comment.value
    );
    const chat = this.chatService.createChatForMatch(match);
    this.message = 'Like enviado. Match local creado correctamente.';
    setTimeout(() => this.router.navigate(['/chat', chat.id]), 700);
  }

  sendLetter(): void {
    this.letterForm.markAllAsTouched();
    if (!this.profile || this.letterForm.invalid) return;

    this.matchService.sendLetter(this.profile.id, this.letterForm.controls.letter.value);
    this.message = 'Carta de conexión enviada correctamente.';
    this.letterForm.reset();
  }

  report(): void {
    if (!this.profile) return;
    this.reportService.reportProfile(
      String(this.profile.id),
      this.reportForm.controls.reason.value,
      this.reportForm.controls.description.value
    );
    this.message = 'Reporte registrado para revisión.';
  }

  block(): void {
    if (!this.profile) return;
    this.reportService.blockProfile(String(this.profile.id));
    this.router.navigate(['/matches']);
  }
}
