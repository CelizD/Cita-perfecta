import { ErrorHandler, Injectable } from '@angular/core';

@Injectable()
export class GlobalErrorHandler implements ErrorHandler {
  handleError(error: unknown): void {
    const err = error instanceof Error ? error : new Error(String(error));
    console.error('[GlobalErrorHandler]', err);

    // Chunk load failures (lazy-route splits) → hard reload
    if (err.message.includes('Loading chunk') || err.message.includes('Failed to fetch dynamically')) {
      window.location.reload();
    }
    // Otros errores: se registran en consola; la UI sigue en su estado actual.
    // No navegamos a /error para evitar loops si el error ocurre durante el boot del router.
  }
}
