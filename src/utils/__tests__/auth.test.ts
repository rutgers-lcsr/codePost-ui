// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock clearLocalSettings before importing auth
vi.mock('../../components/utils/LocalSettings', () => ({
  clearLocalSettings: vi.fn(),
}));

import { getAuthToken, getDecodedTokenPayload } from '../auth';

// Helper to build a mock JWT (header.payload.signature)
function buildMockJwt(payload: Record<string, unknown>): string {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const body = btoa(JSON.stringify(payload));
  return `${header}.${body}.fake-signature`;
}

describe('getAuthToken', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns the token from localStorage', () => {
    vi.mocked(localStorage.getItem).mockReturnValue('my-token');
    expect(getAuthToken()).toBe('my-token');
    expect(localStorage.getItem).toHaveBeenCalledWith('token');
  });

  it('returns empty string when localStorage has no token', () => {
    vi.mocked(localStorage.getItem).mockReturnValue(null);
    expect(getAuthToken()).toBe('');
  });
});

describe('getDecodedTokenPayload', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('decodes a valid JWT payload', () => {
    const payload = { user_id: 42, email: 'test@example.com' };
    vi.mocked(localStorage.getItem).mockReturnValue(buildMockJwt(payload));

    const result = getDecodedTokenPayload();
    expect(result).toEqual(payload);
  });

  it('returns null when no token is stored', () => {
    vi.mocked(localStorage.getItem).mockReturnValue(null);
    expect(getDecodedTokenPayload()).toBeNull();
  });

  it('returns null for a malformed token', () => {
    vi.mocked(localStorage.getItem).mockReturnValue('not-a-jwt');
    expect(getDecodedTokenPayload()).toBeNull();
  });
});

describe('handleUnauthorized', () => {
  it('clears auth storage when token exists', async () => {
    // Reset modules to get a fresh didHandleUnauthorized flag
    vi.resetModules();

    // Re-register the mock after resetModules
    vi.mock('../../components/utils/LocalSettings', () => ({
      clearLocalSettings: vi.fn(),
    }));

    // Re-create localStorage mock with removeItem after resetModules
    const removeItemSpy = vi.fn();
    Object.defineProperty(globalThis, 'localStorage', {
      value: {
        getItem: vi.fn().mockReturnValue('existing-token'),
        setItem: vi.fn(),
        removeItem: removeItemSpy,
        clear: vi.fn(),
      },
      configurable: true,
      writable: true,
    });

    // Suppress the redirect
    Object.defineProperty(window, 'location', {
      value: { href: '/' },
      writable: true,
      configurable: true,
    });

    const authModule = await import('../auth');
    const localSettingsModule = await import('../../components/utils/LocalSettings');

    authModule.handleUnauthorized();

    expect(removeItemSpy).toHaveBeenCalledWith('token');
    expect(removeItemSpy).toHaveBeenCalledWith('isSuperUser');
    expect(localSettingsModule.clearLocalSettings).toHaveBeenCalled();
  });

  it('does nothing when no token is stored', async () => {
    vi.resetModules();

    vi.mock('../../components/utils/LocalSettings', () => ({
      clearLocalSettings: vi.fn(),
    }));

    Object.defineProperty(globalThis, 'localStorage', {
      value: {
        getItem: vi.fn().mockReturnValue(null),
        setItem: vi.fn(),
        removeItem: vi.fn(),
        clear: vi.fn(),
      },
      configurable: true,
      writable: true,
    });

    const authModule = await import('../auth');
    const localSettingsModule = await import('../../components/utils/LocalSettings');

    // Clear any calls from module initialization
    vi.mocked(localSettingsModule.clearLocalSettings).mockClear();
    vi.mocked(localStorage.removeItem).mockClear();

    authModule.handleUnauthorized();

    expect(localStorage.removeItem).not.toHaveBeenCalled();
    expect(localSettingsModule.clearLocalSettings).not.toHaveBeenCalled();
  });
});
