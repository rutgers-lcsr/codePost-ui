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
export function getDecodedTokenPayload(): any | null {
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
 */
export function handleUnauthorized(): void {
  if (didHandleUnauthorized) {
    return;
  }

  const existingToken = getAuthToken();
  if (!existingToken) {
    return;
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
