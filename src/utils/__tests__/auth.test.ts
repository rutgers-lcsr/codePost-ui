// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createLocalStorageMock, installLocalStorageMock } from '../../test-utils';

// Mock clearLocalSettings before importing auth
vi.mock('../../components/utils/LocalSettings', () => ({
  clearLocalSettings: vi.fn(),
}));

import { getAuthToken, getDecodedTokenPayload, resolveSafeRedirectPath } from '../auth';

// Helper to build a mock JWT (header.payload.signature)
function buildMockJwt(payload: Record<string, unknown>): string {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const body = btoa(JSON.stringify(payload));
  return `${header}.${body}.fake-signature`;
}

// Helper: build a valid (non-expired) JWT
function buildValidJwt(): string {
  return buildMockJwt({ user_id: 1, exp: Math.floor(Date.now() / 1000) + 3600 });
}

// Helper: build an expired JWT
function buildExpiredJwt(): string {
  return buildMockJwt({ user_id: 1, exp: Math.floor(Date.now() / 1000) - 100 });
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

describe('resolveSafeRedirectPath', () => {
  it('accepts a relative path', () => {
    expect(resolveSafeRedirectPath('/code/39/')).toBe('/code/39/');
  });

  it('preserves query string and hash', () => {
    expect(resolveSafeRedirectPath('/grader/cs111?tab=tests#top')).toBe('/grader/cs111?tab=tests#top');
  });

  it('rejects an absolute URL, even on the same host', () => {
    expect(resolveSafeRedirectPath('https://dev-codepost-1.cs.rutgers.edu/code/39/')).toBeNull();
    expect(resolveSafeRedirectPath('https://evil.com/code/39/')).toBeNull();
  });

  it('rejects a protocol-relative URL', () => {
    expect(resolveSafeRedirectPath('//evil.com/code/39/')).toBeNull();
  });

  it('rejects a backslash protocol-relative variant', () => {
    expect(resolveSafeRedirectPath('/\\evil.com/code/39/')).toBeNull();
  });

  it('rejects a path without a leading slash', () => {
    expect(resolveSafeRedirectPath('code/39/')).toBeNull();
  });
});

describe('isTokenExpired', () => {
  it('returns true when no token is stored', async () => {
    vi.resetModules();
    vi.mock('../../components/utils/LocalSettings', () => ({ clearLocalSettings: vi.fn() }));

    vi.mocked(localStorage.getItem).mockReturnValue(null);
    const { isTokenExpired } = await import('../auth');
    expect(isTokenExpired()).toBe(true);
  });

  it('returns true when token exp is not a number', async () => {
    vi.resetModules();
    vi.mock('../../components/utils/LocalSettings', () => ({ clearLocalSettings: vi.fn() }));

    vi.mocked(localStorage.getItem).mockReturnValue(buildMockJwt({ user_id: 1, exp: 'not-a-number' }));
    const { isTokenExpired } = await import('../auth');
    expect(isTokenExpired()).toBe(true);
  });

  it('returns false when token is still valid', async () => {
    vi.resetModules();
    vi.mock('../../components/utils/LocalSettings', () => ({ clearLocalSettings: vi.fn() }));

    vi.mocked(localStorage.getItem).mockReturnValue(buildValidJwt());
    const { isTokenExpired } = await import('../auth');
    expect(isTokenExpired()).toBe(false);
  });

  it('returns true when token is expired', async () => {
    vi.resetModules();
    vi.mock('../../components/utils/LocalSettings', () => ({ clearLocalSettings: vi.fn() }));

    vi.mocked(localStorage.getItem).mockReturnValue(buildExpiredJwt());
    const { isTokenExpired } = await import('../auth');
    expect(isTokenExpired()).toBe(true);
  });
});

describe('tryRefreshToken', () => {
  it('returns false when no token is stored', async () => {
    vi.resetModules();
    vi.mock('../../components/utils/LocalSettings', () => ({ clearLocalSettings: vi.fn() }));

    vi.mocked(localStorage.getItem).mockReturnValue(null);
    const { tryRefreshToken } = await import('../auth');
    const result = await tryRefreshToken();
    expect(result).toBe(false);
  });

  it('returns true and stores new token on success', async () => {
    vi.resetModules();
    vi.mock('../../components/utils/LocalSettings', () => ({ clearLocalSettings: vi.fn() }));

    const { mock: lsMock, store } = createLocalStorageMock();
    store['token'] = 'old-token';
    installLocalStorageMock(lsMock);

    const newToken = buildValidJwt();
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ token: newToken }),
      }),
    );

    const { tryRefreshToken } = await import('../auth');
    const result = await tryRefreshToken();
    expect(result).toBe(true);
    expect(localStorage.setItem).toHaveBeenCalledWith('token', newToken);
  });

  it('returns false when refresh endpoint returns not ok', async () => {
    vi.resetModules();
    vi.mock('../../components/utils/LocalSettings', () => ({ clearLocalSettings: vi.fn() }));

    vi.mocked(localStorage.getItem).mockReturnValue('old-token');
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false }));

    const { tryRefreshToken } = await import('../auth');
    const result = await tryRefreshToken();
    expect(result).toBe(false);
  });

  it('returns false when refresh response has no token', async () => {
    vi.resetModules();
    vi.mock('../../components/utils/LocalSettings', () => ({ clearLocalSettings: vi.fn() }));

    vi.mocked(localStorage.getItem).mockReturnValue('old-token');
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({}),
      }),
    );

    const { tryRefreshToken } = await import('../auth');
    const result = await tryRefreshToken();
    expect(result).toBe(false);
  });

  it('returns false on network error', async () => {
    vi.resetModules();
    vi.mock('../../components/utils/LocalSettings', () => ({ clearLocalSettings: vi.fn() }));

    vi.mocked(localStorage.getItem).mockReturnValue('old-token');
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network down')));

    const { tryRefreshToken } = await import('../auth');
    const result = await tryRefreshToken();
    expect(result).toBe(false);
  });

  it('deduplicates concurrent refresh calls', async () => {
    vi.resetModules();
    vi.mock('../../components/utils/LocalSettings', () => ({ clearLocalSettings: vi.fn() }));

    vi.mocked(localStorage.getItem).mockReturnValue('old-token');
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ token: buildValidJwt() }),
      }),
    );

    const { tryRefreshToken } = await import('../auth');
    const [r1, r2] = await Promise.all([tryRefreshToken(), tryRefreshToken()]);
    expect(r1).toBe(true);
    expect(r2).toBe(true);
    // Only one fetch call, second call reuses the in-flight promise
    expect(fetch).toHaveBeenCalledTimes(1);
  });
});

describe('handleUnauthorized', () => {
  beforeEach(() => {
    // Mock fetch so tryRefreshToken fails gracefully (simulates refresh failure)
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 401 }));
  });

  it('skips logout when expired token is successfully refreshed', async () => {
    vi.resetModules();

    vi.mock('../../components/utils/LocalSettings', () => ({
      clearLocalSettings: vi.fn(),
    }));

    const { mock: lsMock, store } = createLocalStorageMock();
    store['token'] = buildExpiredJwt();
    installLocalStorageMock(lsMock);

    Object.defineProperty(window, 'location', {
      value: { href: '/dashboard' },
      writable: true,
      configurable: true,
    });

    // Mock a successful refresh
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ token: buildValidJwt() }),
      }),
    );

    const authModule = await import('../auth');
    await authModule.handleUnauthorized();

    // Should NOT redirect — token was refreshed
    expect(window.location.href).toBe('/dashboard');
    // The refreshed token should be stored
    expect(localStorage.setItem).toHaveBeenCalledWith('token', expect.any(String));
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
