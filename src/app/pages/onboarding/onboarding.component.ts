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
  selectedDealbreakers = new Set<string>();
  interests = this.userService.interests;
  communicationStyles = this.userService.communicationStyles;
  loveLanguages = this.userService.loveLanguages;
  dealbreakers = this.userService.dealbreakers;

  form = this.fb.nonNullable.group({
    city: ['', Validators.required],
    bio: ['', [Validators.required, Validators.minLength(20)]],
    communicationStyle: [this.communicationStyles[0], Validators.required],
    loveLanguage: [this.loveLanguages[0], Validators.required],
    photoProfile: ['']
  });

  toggleInterest(interest: string): void {
    if (this.selectedInterests.has(interest)) {
      this.selectedInterests.delete(interest);
    } else {
      this.selectedInterests.add(interest);
    }
  }

  toggleDealbreaker(dealbreaker: string): void {
    if (this.selectedDealbreakers.has(dealbreaker)) {
      this.selectedDealbreakers.delete(dealbreaker);
    } else {
      this.selectedDealbreakers.add(dealbreaker);
    }
  }

  submit(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid || this.selectedInterests.size < 3) return;

    this.userService.saveProfile({
      city: this.form.controls.city.value,
      bio: this.form.controls.bio.value,
      photoProfile: this.form.controls.photoProfile.value,
      interests: [...this.selectedInterests],
      communicationStyle: this.form.controls.communicationStyle.value,
      loveLanguage: this.form.controls.loveLanguage.value,
      dealbreakers: [...this.selectedDealbreakers]
    });

    this.router.navigate(['/test']);
  }
}
