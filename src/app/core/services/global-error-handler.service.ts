import { ErrorHandler, Injectable, NgZone, inject } from '@angular/core';
import { Router } from '@angular/router';

@Injectable()
export class GlobalErrorHandler implements ErrorHandler {
  private zone = inject(NgZone);
  private router = inject(Router);

  handleError(error: unknown): void {
    const err = error instanceof Error ? error : new Error(String(error));
    console.error('[GlobalErrorHandler]', err);

    // Chunk load failures (lazy-route splits) → hard reload to pick up new hashes
    if (err.message.includes('Loading chunk') || err.message.includes('Failed to fetch dynamically') || err.message.includes('ChunkLoadError')) {
      window.location.reload();
      return;
    }

    // Cualquier otro error no controlado: redirigir a login para evitar pantalla blanca
    this.zone.run(() => {
      void this.router.navigate(['/login']);
    });
  }
}
