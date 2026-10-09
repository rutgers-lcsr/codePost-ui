// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import { Button, message, notification } from 'antd';

import { FetchError, ResponseError } from '../api-client/runtime';
import { apiErrorMessageAsync } from './apiError';

export const UPDATE_AVAILABLE_TITLE = 'codePost was updated';
export const UPDATE_AVAILABLE_TEXT = 'Reload to get the new version.';

/** A lazy chunk that no longer exists on the server: the SPA was redeployed under this tab. */
export function isChunkLoadError(reason: unknown): boolean {
  if (!(reason instanceof Error)) return false;
  return (
    reason.name === 'ChunkLoadError' ||
    /Failed to fetch dynamically imported module|Importing a module script failed|error loading dynamically imported module/i.test(
      reason.message,
    )
  );
}

/** One sticky notification with a Reload button (keyed, so repeats replace rather than stack). */
export function showUpdateAvailable(): void {
  notification.warning({
    key: 'codepost-updated',
    title: UPDATE_AVAILABLE_TITLE,
    description: UPDATE_AVAILABLE_TEXT,
    duration: 0,
    btn: (
      <Button type="primary" size="small" onClick={() => window.location.reload()}>
        Reload
      </Button>
    ),
  });
}

const TOAST_DEDUPE_MS = 2000;
let lastToastAt = 0;

/** A failed page load can reject a dozen promises at once: show one toast per burst. */
function toastOnce(text: string): void {
  const now = Date.now();
  if (now - lastToastAt < TOAST_DEDUPE_MS) return;
  lastToastAt = now;
  message.error(text);
}

/** Last-resort handlers for what nothing caught: an API failure gets one toast, a redeploy
 *  mid-session gets the reload prompt, and everything else goes to the console. */
export function installGlobalErrorHandlers(): void {
  window.addEventListener('unhandledrejection', (event) => {
    const { reason } = event;
    if (isChunkLoadError(reason)) {
      event.preventDefault();
      showUpdateAvailable();
      return;
    }
    if (reason instanceof ResponseError || reason instanceof FetchError) {
      void apiErrorMessageAsync(reason).then((text) => toastOnce(text ?? 'Something went wrong.'));
      return;
    }
    console.error('Unhandled promise rejection:', reason);
  });

  // Vite's own signal that a lazy chunk failed to load (a new deploy under this tab).
  window.addEventListener('vite:preloadError', (event) => {
    event.preventDefault();
    showUpdateAvailable();
  });
}
