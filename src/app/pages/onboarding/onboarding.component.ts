import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { UserService } from '../../core/services/user.service';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-onboarding',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './onboarding.component.html',
  styleUrl: './onboarding.component.scss'
})
export class OnboardingComponent {
  private fb = inject(FormBuilder);
  private userService = inject(UserService);
  public authService = inject(AuthService);
  private router = inject(Router);

  selectedInterests = new Set<string>();
  interests = this.userService.interests;

  form = this.fb.nonNullable.group({
    city: ['', Validators.required],
    bio: ['', [Validators.required, Validators.minLength(20)]],
    photoProfile: ['']
  });

  toggleInterest(interest: string): void {
    if (this.selectedInterests.has(interest)) {
      this.selectedInterests.delete(interest);
    } else {
      this.selectedInterests.add(interest);
    }
  }

  submit(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid || this.selectedInterests.size < 3) return;

    this.userService.saveProfile({
      city: this.form.controls.city.value,
      bio: this.form.controls.bio.value,
      photoProfile: this.form.controls.photoProfile.value,
      interests: [...this.selectedInterests]
    });

    this.router.navigate(['/test']);
  }
}
