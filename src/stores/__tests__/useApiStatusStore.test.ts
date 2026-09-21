// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { apiStatusMiddleware, useApiStatusStore } from '../useApiStatusStore';

const post = (status: number) =>
  apiStatusMiddleware.post!({ fetch: vi.fn(), url: '', init: {}, response: { status } as Response });

const onError = () =>
  apiStatusMiddleware.onError!({ fetch: vi.fn(), url: '', init: {}, error: new Error('down'), response: undefined });

const setOnline = (value: boolean) => Object.defineProperty(navigator, 'onLine', { configurable: true, value });

describe('useApiStatusStore', () => {
  beforeEach(() => {
    useApiStatusStore.setState({ status: 'ok' });
  });

  afterEach(() => {
    // Drop the instance override so the prototype getter is back in charge.
    delete (navigator as unknown as Record<string, unknown>).onLine;
  });

  it('marks the API unavailable on a gateway 503 response', async () => {
    await post(503);
    expect(useApiStatusStore.getState().status).toBe('unavailable');
  });

  it('marks the API ok again on a 200 response', async () => {
    useApiStatusStore.setState({ status: 'unavailable' });
    await post(200);
    expect(useApiStatusStore.getState().status).toBe('ok');
  });

  it('ignores a network error while the browser is offline', async () => {
    setOnline(false);
    await onError();
    expect(useApiStatusStore.getState().status).toBe('ok');
  });

  it('marks the API unavailable on a network error while online', async () => {
    setOnline(true);
    await onError();
    expect(useApiStatusStore.getState().status).toBe('unavailable');
  });

  it('does not notify subscribers when markOk is a no-op', () => {
    useApiStatusStore.setState({ status: 'unavailable' });
    const listener = vi.fn();
    const unsubscribe = useApiStatusStore.subscribe(listener);
    useApiStatusStore.getState().markOk();
    useApiStatusStore.getState().markOk();
    unsubscribe();
    expect(listener).toHaveBeenCalledTimes(1);
  });
});
