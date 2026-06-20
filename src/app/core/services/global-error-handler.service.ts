import { ErrorHandler, Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';

@Injectable()
export class GlobalErrorHandler implements ErrorHandler {
  private readonly router = inject(Router);

  handleError(error: unknown): void {
    const err = error instanceof Error ? error : new Error(String(error));
    console.error('[GlobalErrorHandler]', err);

    // Chunk load failures (lazy-route splits) → hard reload
    if (err.message.includes('Loading chunk') || err.message.includes('Failed to fetch dynamically')) {
      window.location.reload();
      return;
    }

    // Navigate to error page for unhandled runtime errors
    this.router.navigate(['/error']).catch(() => {
      // If navigation fails we're in a bad state; surface to console only.
    });
  }
}
