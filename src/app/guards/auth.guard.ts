import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { from, map } from 'rxjs';
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
