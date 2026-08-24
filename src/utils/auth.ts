// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import { clearLocalSettings } from '../components/utils/LocalSettings';

/**
 * Gets the access token from localStorage.
 *
 * (Stored under the historical `token` key so every existing consumer keeps
 * working; the long-lived refresh token lives under `refresh`.)
 */
export function getAuthToken(): string {
  return localStorage.getItem('token') || '';
}

/**
 * Gets the refresh token from localStorage.
 */
export function getRefreshToken(): string {
  return localStorage.getItem('refresh') || '';
}

/**
 * Persist an access token and, when provided, a refresh token. A refresh token
 * is only overwritten when one is supplied, so responses that carry just an
 * access token (e.g. profile saves) leave the existing refresh token intact.
 */
export function setTokens(access: string, refresh?: string | null): void {
  localStorage.setItem('token', access);
  if (refresh) {
    localStorage.setItem('refresh', refresh);
  }
}

/**
 * Clear both tokens from localStorage.
 */
export function clearTokens(): void {
  localStorage.removeItem('token');
  localStorage.removeItem('refresh');
}

/**
 * Gets Decoded Token Payload
 */
export function getDecodedTokenPayload(): Record<string, unknown> | null {
  const token = getAuthToken();
  if (!token) return null;

  try {
    const tokenPayloadBase64 = token.split('.')[1];
    const tokenPayloadJson = atob(tokenPayloadBase64);
    return JSON.parse(tokenPayloadJson);
  } catch (error) {
    console.error('Error decoding token:', error);
    return null;
  }
}

/**
 * Gets the `user_id` claim of the stored access token, or null if there is no
 * token or it cannot be decoded. Used to detect identity switches performed by
 * another tab (the tokens live in shared localStorage).
 */
export function getStoredTokenUserId(): number | null {
  const payload = getDecodedTokenPayload();
  return payload && typeof payload.user_id === 'number' ? payload.user_id : null;
}

/**
 * Check whether the current JWT token is expired.
 * Returns `true` if expired or unparseable, `false` if still valid.
 */
export function isTokenExpired(): boolean {
  const payload = getDecodedTokenPayload();
  if (!payload || typeof payload.exp !== 'number') return true;
  // Compare with a 30-second buffer so we don't race the server
  return Date.now() >= (payload.exp - 30) * 1000;
}

/** In-flight refresh promise — prevents multiple concurrent refresh attempts. */
let refreshPromise: Promise<boolean> | null = null;

/**
 * Attempt to exchange the refresh token for a fresh access token.
 *
 * Because rotation is enabled server-side, a new refresh token is returned too
 * and stored. Returns `true` if a new access token was obtained, `false`
 * otherwise. Concurrent callers share a single in-flight request.
 */
export async function tryRefreshToken(): Promise<boolean> {
  if (refreshPromise) return refreshPromise;

  // Another tab may have already rotated the pair (rotation blacklists the
  // old refresh token, so racing it would fail); if the stored access token
  // is still fresh there is nothing to do.
  if (!isTokenExpired()) return true;

  refreshPromise = (async () => {
    const refresh = getRefreshToken();
    if (!refresh) return false;

    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL}/token-refresh/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh }),
      });

      if (!res.ok) return false;

      const data: { access?: string; refresh?: string } = await res.json();
      if (data.access) {
        setTokens(data.access, data.refresh);
        return true;
      }
      return false;
    } catch {
      return false;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

/**
 * Revoke the current session server-side (blacklists the refresh token) on a
 * best-effort basis, then clear local tokens. Safe to call even if the network
 * request fails — local state is always cleared.
 */
export async function logout(): Promise<void> {
  const refresh = getRefreshToken();
  if (refresh) {
    try {
      await fetch(`${process.env.REACT_APP_API_URL}/logout/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getAuthToken()}`,
        },
        body: JSON.stringify({ refresh }),
      });
    } catch {
      // Best effort — fall through and clear local state regardless.
    }
  }
  clearTokens();
}

/**
 * Validate a `redirect` query-param value as a safe relative path.
 *
 * Only relative paths ("/code/39/") are accepted; absolute URLs,
 * protocol-relative ("//evil.com"), and backslash variants ("/\evil.com",
 * which browsers normalize to "//") are rejected so a newly-stored token
 * can't leak off-site. Returns the path to navigate to, or null if unsafe.
 */
export function resolveSafeRedirectPath(value: string): string | null {
  if (value.startsWith('/') && !value.startsWith('//') && !value.startsWith('/\\')) {
    return value;
  }
  return null;
}

/**
 * Redirect to login page
 */
export function redirectToLogin(): void {
  clearTokens();
  window.location.href = '/';
  // Root renders the login screen for unauthenticated users
}

let didHandleUnauthorized = false;

/**
 * Clear auth state and force the user to re-authenticate.
 * This is intended to be called when the API returns 401.
 *
 * If the access token looks expired (based on its JWT `exp` claim), we first
 * attempt a refresh using the refresh token.  Only when the refresh also fails
 * do we log the user out and redirect.
 */
export async function handleUnauthorized(): Promise<void> {
  if (didHandleUnauthorized) {
    return;
  }

  const existingToken = getAuthToken();
  if (!existingToken) {
    return;
  }

  // If the access token is expired (or about to expire), try to refresh it
  // before giving up and logging the user out.
  if (isTokenExpired()) {
    const refreshed = await tryRefreshToken();
    if (refreshed) {
      // Token was successfully refreshed — do NOT redirect.
      // The caller (middleware) can retry the request with the new token
      // on the next call; the one-shot guard is NOT set so future 401s
      // are still handled.
      return;
    }
  }

  didHandleUnauthorized = true;

  try {
    clearTokens();
    localStorage.removeItem('isSuperUser');
  } catch (error) {
    console.error('Failed clearing auth storage:', error);
  }

  try {
    clearLocalSettings();
  } catch (error) {
    console.warn('Failed clearing local settings:', error);
  }

  redirectToLogin();
}
