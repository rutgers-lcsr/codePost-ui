// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import { clearLocalSettings } from '../components/utils/LocalSettings';

/**
 * Gets the authorization token from localStorage
 */
export function getAuthToken(): string {
  return localStorage.getItem('token') || '';
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
 * Attempt to refresh the current JWT token via the sliding-token endpoint.
 * Returns `true` if the token was refreshed, `false` otherwise.
 */
export async function tryRefreshToken(): Promise<boolean> {
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    const token = getAuthToken();
    if (!token) return false;

    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL}/token-refresh/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });

      if (!res.ok) return false;

      const data: { token?: string } = await res.json();
      if (data.token) {
        localStorage.setItem('token', data.token);
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
  localStorage.removeItem('token');
  window.location.href = '/';
  // Root renders the login screen for unauthenticated users
}

let didHandleUnauthorized = false;

/**
 * Clear auth state and force the user to re-authenticate.
 * This is intended to be called when the API returns 401.
 *
 * If the token looks expired (based on the JWT `exp` claim), we first
 * attempt a sliding-token refresh.  Only when the refresh also fails do
 * we log the user out and redirect.
 */
export async function handleUnauthorized(): Promise<void> {
  if (didHandleUnauthorized) {
    return;
  }

  const existingToken = getAuthToken();
  if (!existingToken) {
    return;
  }

  // If the token is expired (or about to expire), try to refresh it
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
    localStorage.removeItem('token');
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
