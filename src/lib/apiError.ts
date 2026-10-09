// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import { FetchError, ResponseError } from '../api-client/runtime';

/** Gateway statuses nginx answers with while the API is down or overloaded. */
export const UNAVAILABLE_STATUSES = new Set([502, 503, 504]);

export const API_UNAVAILABLE_MESSAGE = "codePost can't reach the server right now. Please try again in a moment.";

/** Shown for a 413 whose body carries no message (an nginx default page). Django and both
 *  nginx configs normally answer 413 with a JSON `detail` that names the limit. */
export const UPLOAD_TOO_LARGE_MESSAGE = 'That upload is too large for the server.';

/** True for a generated-client error caused by an outage: the fetch itself threw
 *  (host unreachable) or the gateway answered 502/503/504. */
export function isApiUnavailableError(e: unknown): boolean {
  return e instanceof FetchError || (e instanceof ResponseError && UNAVAILABLE_STATUSES.has(e.response.status));
}

/** DRF error body → message: the given field-error keys first (`{field: ["msg", …]}`),
 *  then `nonFieldErrors`, then `detail` / `error`. */
function messageFromBody(body: unknown, fieldNames: string[]): string | undefined {
  if (!body || typeof body !== 'object') return undefined;
  const record = body as Record<string, unknown>;
  for (const field of [...fieldNames, 'nonFieldErrors']) {
    const value = record[field];
    if (Array.isArray(value) && typeof value[0] === 'string') return value[0];
    if (typeof value === 'string' && fieldNames.includes(field)) return value;
  }
  const detail = record.detail ?? record.error;
  return typeof detail === 'string' ? detail : undefined;
}

/** Extract a human-readable message from a generated-client API error.
 *
 * Checks the given field-error keys first (DRF returns `{field: ["msg", …]}` for
 * validation errors), then the standard `detail` / `error` keys. Returns undefined
 * when nothing usable is present so callers can supply their own fallback.
 *
 * Only sees a body a caller attached to the error (`e.body`); the generated client's
 * `ResponseError` carries none, so prefer `apiErrorMessageAsync` after an API call.
 */
export function apiErrorMessage(e: unknown, ...fieldNames: string[]): string | undefined {
  if (isApiUnavailableError(e)) return API_UNAVAILABLE_MESSAGE;
  return messageFromBody((e as { body?: unknown })?.body, fieldNames);
}

/** Message for a raw `fetch` Response the server rejected.
 *
 * Reads the JSON body like `apiErrorMessage` (any remaining `key: value` pairs are joined
 * as a last resort), then falls back to `tooLarge` (or the generic upload-too-large text)
 * for a 413, and to the status text otherwise. `tooLarge` wins over the body for a 413 so
 * a caller that knows its own limit (datasets: 1 GB) can say so.
 */
export async function responseErrorMessage(
  response: Response,
  opts: { fieldNames?: string[]; tooLarge?: string } = {},
): Promise<string> {
  if (response.status === 413 && opts.tooLarge) return opts.tooLarge;
  try {
    // Consumes the body: callers throw or return after this.
    const body: unknown = await response.json();
    const known = messageFromBody(body, opts.fieldNames ?? []);
    if (known) return known;
    if (body && typeof body === 'object') {
      const parts = Object.entries(body as Record<string, unknown>).map(
        ([k, v]) => `${k}: ${Array.isArray(v) ? v.join(' ') : String(v)}`,
      );
      if (parts.length) return parts.join('; ');
    }
  } catch {
    // Not JSON (e.g. an nginx error page) — fall through.
  }
  if (response.status === 413) return UPLOAD_TOO_LARGE_MESSAGE;
  return response.statusText || `HTTP ${response.status}`;
}

/** `apiErrorMessage`, but for a generated-client `ResponseError` it also reads the
 *  response body, so the API's own validation text (e.g. "File 'x.pdf' exceeds the 10MB
 *  size limit.") reaches the user. Undefined when nothing usable is present. Safe to call
 *  more than once on the same error. */
export async function apiErrorMessageAsync(e: unknown, ...fieldNames: string[]): Promise<string | undefined> {
  const direct = apiErrorMessage(e, ...fieldNames);
  if (direct) return direct;
  if (!(e instanceof ResponseError)) return undefined;
  // Read a clone so the same error can be inspected again (e.g. once for a field error, once
  // for `detail`). A consumed body can't be cloned — and then there is nothing left to read.
  let response = e.response;
  try {
    response = e.response.clone();
  } catch {
    /* fall through to the original */
  }
  const message = await responseErrorMessage(response, { fieldNames });
  // Status text alone ("Bad Request") is no better than the caller's fallback.
  return message === (e.response.statusText || `HTTP ${e.response.status}`) ? undefined : message;
}
