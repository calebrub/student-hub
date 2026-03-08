import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { retry, timer } from 'rxjs';

const RETRYABLE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);
const MAX_RETRIES = 2;
const RETRY_BASE_DELAY_MS = 700;

export const apiRetryInterceptor: HttpInterceptorFn = (req, next) => {
  const shouldRetry = RETRYABLE_METHODS.has(req.method.toUpperCase());

  return next(req).pipe(
    retry({
      count: shouldRetry ? MAX_RETRIES : 0,
      delay: (error: unknown, retryCount: number) => {
        if (!(error instanceof HttpErrorResponse)) {
          throw error;
        }

        const isRetryableStatus =
          error.status === 0 ||
          error.status === 429 ||
          error.status >= 500;

        if (!isRetryableStatus) {
          throw error;
        }

        return timer(RETRY_BASE_DELAY_MS * retryCount);
      }
    })
  );
};
