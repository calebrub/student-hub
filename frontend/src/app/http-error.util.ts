import { HttpErrorResponse } from '@angular/common/http';

export function getHttpErrorMessage(error: unknown, fallback: string): string {
  if (!(error instanceof HttpErrorResponse)) {
    return fallback;
  }

  if (typeof error.error === 'string' && error.error.trim()) {
    return error.error;
  }

  if (error.error && typeof error.error === 'object') {
    const apiMessage =
      (error.error as { message?: unknown }).message ??
      (error.error as { error?: unknown }).error;

    if (typeof apiMessage === 'string' && apiMessage.trim()) {
      return apiMessage;
    }
  }

  if (error.status === 0) {
    return 'Network error. Please check your connection and try again.';
  }

  if (error.message?.trim()) {
    return error.message;
  }

  return fallback;
}
