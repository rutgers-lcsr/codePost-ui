// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import { FetchError, ResponseError } from '../api-client/runtime';

/** Gateway statuses nginx answers with while the API is down or overloaded. */
export const UNAVAILABLE_STATUSES = new Set([502, 503, 504]);

export const API_UNAVAILABLE_MESSAGE = "codePost can't reach the server right now. Please try again in a moment.";

/** True for a generated-client error caused by an outage: the fetch itself threw
 *  (host unreachable) or the gateway answered 502/503/504. */
export function isApiUnavailableError(e: unknown): boolean {
  return e instanceof FetchError || (e instanceof ResponseError && UNAVAILABLE_STATUSES.has(e.response.status));
}

/** Extract a human-readable message from a generated-client API error.
 *
 * Checks the given field-error keys first (DRF returns `{field: ["msg", …]}` for
 * validation errors), then the standard `detail` / `error` keys. Returns undefined
 * when nothing usable is present so callers can supply their own fallback.
 */
export function apiErrorMessage(e: unknown, ...fieldNames: string[]): string | undefined {
  if (isApiUnavailableError(e)) return API_UNAVAILABLE_MESSAGE;
  const body = (e as { body?: Record<string, unknown> })?.body;
  if (!body) return undefined;
  for (const field of [...fieldNames, 'nonFieldErrors']) {
    const value = body[field];
    if (Array.isArray(value) && typeof value[0] === 'string') return value[0];
    if (typeof value === 'string' && fieldNames.includes(field)) return value;
  }
  const detail = body.detail ?? body.error;
  return typeof detail === 'string' ? detail : undefined;
}
