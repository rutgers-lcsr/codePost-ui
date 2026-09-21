// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

import type { Middleware } from '../api-client/runtime';
import { UNAVAILABLE_STATUSES } from '../lib/apiError';

export type ApiStatus = 'ok' | 'unavailable';

interface ApiStatusStore {
  status: ApiStatus;
  markUnavailable: () => void;
  markOk: () => void;
}

/**
 * Whether the API is reachable, as observed by the generated client's traffic.
 * `ApiUnavailableBanner` subscribes to this and polls the readiness endpoint
 * until the API comes back.
 */
export const useApiStatusStore = create<ApiStatusStore>()(
  devtools(
    (set, get) => ({
      status: 'ok',
      markUnavailable: () => {
        if (get().status !== 'unavailable') set({ status: 'unavailable' });
      },
      markOk: () => {
        if (get().status !== 'ok') set({ status: 'ok' });
      },
    }),
    { name: 'apiStatus' },
  ),
);

/** Record the status of any API response (gateway 502/503/504 ⇒ unavailable). */
export function noteApiResponse(status: number): void {
  if (UNAVAILABLE_STATUSES.has(status)) {
    useApiStatusStore.getState().markUnavailable();
  } else {
    useApiStatusStore.getState().markOk();
  }
}

/** Record a fetch that threw. Being offline is the browser's problem, not an outage. */
export function noteApiNetworkError(): void {
  if (navigator.onLine !== false) {
    useApiStatusStore.getState().markUnavailable();
  }
}

export const apiStatusMiddleware: Middleware = {
  post: async ({ response }) => {
    noteApiResponse(response.status);
    return response;
  },
  onError: async ({ response }) => {
    noteApiNetworkError();
    return response;
  },
};
