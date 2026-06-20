import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { from, map, switchMap } from 'rxjs';
import { SupabaseService } from '../services/supabase.service';

export const authGuard: CanActivateFn = () => {
  const supabase = inject(SupabaseService);
  const router = inject(Router);

  return from(supabase.getCurrentUser()).pipe(
    map((user) => (user ? true : router.createUrlTree(['/login'])))
  );
};

export const publicGuard: CanActivateFn = () => {
  const supabase = inject(SupabaseService);
  const router = inject(Router);

  return from(supabase.getCurrentUser()).pipe(
    map((user) => (!user ? true : router.createUrlTree(['/dashboard'])))
  );
};

export const onboardingGuard: CanActivateFn = () => {
  const supabase = inject(SupabaseService);
  const router = inject(Router);

  return from(supabase.getCurrentUser()).pipe(
    switchMap((user) => {
      if (!user) {
        return [router.createUrlTree(['/login'])];
      }

      return from(supabase.getProfile(user.id)).pipe(
        map(({ data, error }) => {
          if (error || !data) {
            return true;
          }

          return data['is_onboarded'] ? router.createUrlTree(['/dashboard']) : true;
        })
      );
    })
  );
};
