// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import { IMPERSONATOR_KEY, getAuthToken, getRefreshToken, setTokens } from '../../utils/auth';

interface StashedSession {
  token: string;
  refresh: string;
  returnTo: string;
}

/**
 * Keep the staff session for this tab, then switch to the target user. The switch is a full
 * reload through /loginAs, so the stash lives in sessionStorage: it survives the reload and
 * dies with the tab.
 */
export function startImpersonation(
  email: string,
  // Back to the exact page and filter the staff member left, not the console's front door.
  returnTo = `${window.location.pathname}${window.location.search}`,
): void {
  try {
    const stash: StashedSession = { token: getAuthToken(), refresh: getRefreshToken(), returnTo };
    sessionStorage.setItem(IMPERSONATOR_KEY, JSON.stringify(stash));
  } catch {
    // No storage: impersonation still works, there is just no one-click way back.
  }
  window.location.href = `/loginAs?email=${encodeURIComponent(email)}`;
}

/** The staff session waiting to be restored, if this tab is impersonating. */
export function stashedImpersonator(): StashedSession | null {
  try {
    const raw = sessionStorage.getItem(IMPERSONATOR_KEY);
    return raw ? (JSON.parse(raw) as StashedSession) : null;
  } catch {
    return null;
  }
}

/** Put the staff tokens back and return to where impersonation started. */
export function endImpersonation(): void {
  const stashed = stashedImpersonator();
  try {
    sessionStorage.removeItem(IMPERSONATOR_KEY);
  } catch {
    // Nothing to remove.
  }
  if (!stashed) return;
  setTokens(stashed.token, stashed.refresh);
  window.location.href = stashed.returnTo;
}
