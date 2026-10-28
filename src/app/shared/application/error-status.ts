import { HttpErrorResponse } from '@angular/common/http';
import { ApiError } from '../infrastructure/api-error';

/**
 * Reads the HTTP status of a failed request, so a view can choose its message without knowing HTTP.
 *
 * @param error - Error emitted by a store
 * @returns The HTTP status (0 when the server could not be reached), or null if the error did not come from a request
 */
export function errorStatus(error: unknown): number | null {
  return error instanceof ApiError || error instanceof HttpErrorResponse ? error.status : null;
}
