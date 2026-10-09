// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('antd', () => ({
  Button: () => null,
  message: { error: vi.fn() },
  notification: { warning: vi.fn() },
}));

import { message, notification } from 'antd';
import { FetchError, ResponseError } from '../../api-client/runtime';
import { API_UNAVAILABLE_MESSAGE } from '../apiError';
import { installGlobalErrorHandlers, isChunkLoadError, UPDATE_AVAILABLE_TITLE } from '../globalErrors';

installGlobalErrorHandlers();

const reject = (reason: unknown) => {
  const event = Object.assign(new Event('unhandledrejection', { cancelable: true }), { reason });
  window.dispatchEvent(event);
  return event;
};
const flush = () => new Promise((resolve) => setTimeout(resolve, 0));
const unavailable = () => new ResponseError({ status: 503 } as Response);

// The de-dupe window is keyed off Date.now(); start each test well past the previous one.
let clock = 1_000_000;

describe('installGlobalErrorHandlers', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    clock += 60_000;
    vi.setSystemTime(clock);
    vi.clearAllMocks();
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('shows one toast for a burst of unhandled API errors', async () => {
    reject(unavailable());
    reject(unavailable());
    reject(new FetchError(new Error('down')));
    await flush();

    expect(message.error).toHaveBeenCalledTimes(1);
    expect(message.error).toHaveBeenCalledWith(API_UNAVAILABLE_MESSAGE);
    expect(console.error).not.toHaveBeenCalled();
  });

  it('toasts again once the de-dupe window has passed', async () => {
    reject(unavailable());
    await flush();
    vi.setSystemTime(clock + 2_500);
    reject(unavailable());
    await flush();

    expect(message.error).toHaveBeenCalledTimes(2);
  });

  it('logs anything that is not an API error', async () => {
    reject(new Error('plain bug'));
    await flush();

    expect(message.error).not.toHaveBeenCalled();
    expect(console.error).toHaveBeenCalled();
  });

  it('offers a reload for a chunk that no longer exists (deploy mid-session)', async () => {
    const event = reject(new TypeError('Failed to fetch dynamically imported module: /assets/x.js'));
    await flush();

    expect(event.defaultPrevented).toBe(true);
    expect(notification.warning).toHaveBeenCalledWith(expect.objectContaining({ title: UPDATE_AVAILABLE_TITLE }));
    expect(message.error).not.toHaveBeenCalled();
  });

  it("offers a reload on Vite's preload error", () => {
    const event = new Event('vite:preloadError', { cancelable: true });
    window.dispatchEvent(event);

    expect(event.defaultPrevented).toBe(true);
    expect(notification.warning).toHaveBeenCalledWith(expect.objectContaining({ title: UPDATE_AVAILABLE_TITLE }));
  });
});

describe('isChunkLoadError', () => {
  it('recognises webpack- and Vite-style chunk failures only', () => {
    expect(isChunkLoadError(Object.assign(new Error('Loading chunk 3 failed'), { name: 'ChunkLoadError' }))).toBe(true);
    expect(isChunkLoadError(new TypeError('Failed to fetch dynamically imported module: /a.js'))).toBe(true);
    expect(isChunkLoadError(new TypeError('error loading dynamically imported module: /a.js'))).toBe(true);
    expect(isChunkLoadError(new Error('Failed to fetch'))).toBe(false);
    expect(isChunkLoadError('Failed to fetch dynamically imported module')).toBe(false);
  });
});
