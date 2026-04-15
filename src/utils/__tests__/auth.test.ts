// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createLocalStorageMock, installLocalStorageMock } from '../../test-utils';

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
  beforeEach(() => {
    // Mock fetch so tryRefreshToken fails gracefully (simulates refresh failure)
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 401 }));
  });

  it('clears auth storage when token exists', async () => {
    // Reset modules to get a fresh didHandleUnauthorized flag
    vi.resetModules();

    // Re-register the mock after resetModules
    vi.mock('../../components/utils/LocalSettings', () => ({
      clearLocalSettings: vi.fn(),
    }));

    // Use centralized localStorage mock with data persistence
    const { mock } = createLocalStorageMock();
    vi.mocked(mock.getItem).mockReturnValue('existing-token');
    installLocalStorageMock(mock);

    // Suppress the redirect
    Object.defineProperty(window, 'location', {
      value: { href: '/' },
      writable: true,
      configurable: true,
    });

    const authModule = await import('../auth');
    const localSettingsModule = await import('../../components/utils/LocalSettings');

    await authModule.handleUnauthorized();

    expect(localStorage.removeItem).toHaveBeenCalledWith('token');
    expect(localStorage.removeItem).toHaveBeenCalledWith('isSuperUser');
    expect(localSettingsModule.clearLocalSettings).toHaveBeenCalled();
  });

  it('does nothing when no token is stored', async () => {
    vi.resetModules();

    vi.mock('../../components/utils/LocalSettings', () => ({
      clearLocalSettings: vi.fn(),
    }));

    const { mock: lsMock } = createLocalStorageMock();
    vi.mocked(lsMock.getItem).mockReturnValue(null);
    installLocalStorageMock(lsMock);

    const authModule = await import('../auth');
    const localSettingsModule = await import('../../components/utils/LocalSettings');

    // Clear any calls from module initialization
    vi.mocked(localSettingsModule.clearLocalSettings).mockClear();
    vi.mocked(localStorage.removeItem).mockClear();

    await authModule.handleUnauthorized();

    expect(localStorage.removeItem).not.toHaveBeenCalled();
    expect(localSettingsModule.clearLocalSettings).not.toHaveBeenCalled();
  });

  it('only fires once due to didHandleUnauthorized guard', async () => {
    vi.resetModules();

    vi.mock('../../components/utils/LocalSettings', () => ({
      clearLocalSettings: vi.fn(),
    }));

    const { mock: lsMock } = createLocalStorageMock();
    vi.mocked(lsMock.getItem).mockReturnValue('token');
    installLocalStorageMock(lsMock);

    Object.defineProperty(window, 'location', {
      value: { href: '/' },
      writable: true,
      configurable: true,
    });

    const authModule = await import('../auth');

    await authModule.handleUnauthorized();
    vi.mocked(localStorage.removeItem).mockClear();

    // Second call should be a no-op
    await authModule.handleUnauthorized();
    expect(localStorage.removeItem).not.toHaveBeenCalled();
  });

  it('survives when localStorage.removeItem throws', async () => {
    vi.resetModules();

    vi.mock('../../components/utils/LocalSettings', () => ({
      clearLocalSettings: vi.fn(),
    }));

    const { mock: lsMock } = createLocalStorageMock();
    installLocalStorageMock(lsMock);
    vi.mocked(lsMock.getItem).mockReturnValue('existing-token');

    Object.defineProperty(window, 'location', {
      value: { href: '/' },
      writable: true,
      configurable: true,
    });

    const authModule = await import('../auth');

    // Only the first removeItem call throws (inside try-catch).
    // Subsequent calls (isSuperUser removal, redirectToLogin) succeed normally.
    vi.mocked(lsMock.removeItem).mockImplementationOnce(() => {
      throw new Error('Storage full');
    });

    await authModule.handleUnauthorized();
    // Redirect still happens despite the first removeItem failure
    expect(window.location.href).toBe('/');
  });

  it('continues even when clearLocalSettings throws', async () => {
    vi.resetModules();

    vi.mock('../../components/utils/LocalSettings', () => ({
      clearLocalSettings: vi.fn(() => {
        throw new Error('Settings error');
      }),
    }));

    const { mock: lsMock } = createLocalStorageMock();
    vi.mocked(lsMock.getItem).mockReturnValue('existing-token');
    installLocalStorageMock(lsMock);

    Object.defineProperty(window, 'location', {
      value: { href: '/' },
      writable: true,
      configurable: true,
    });

    const authModule = await import('../auth');

    // Should not throw — catches internally
    await expect(authModule.handleUnauthorized()).resolves.not.toThrow();
    // Should still redirect
    expect(window.location.href).toBe('/');
  });
});
