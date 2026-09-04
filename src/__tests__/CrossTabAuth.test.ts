// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getStoredTokenUserId, tryRefreshToken } from '../utils/auth';
import { createLocalStorageMock, installLocalStorageMock, restoreLocalStorage } from '../test-utils/mocks';

function makeToken(payload: Record<string, unknown>): string {
  return `header.${btoa(JSON.stringify(payload))}.signature`;
}

const freshExp = () => Math.floor(Date.now() / 1000) + 3600;
const expiredExp = () => Math.floor(Date.now() / 1000) - 3600;

const { mock } = createLocalStorageMock();

beforeEach(() => {
  installLocalStorageMock(mock);
  localStorage.clear();
});

afterEach(() => {
  restoreLocalStorage();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('getStoredTokenUserId', () => {
  it('returns the user_id claim of the stored token', () => {
    localStorage.setItem('token', makeToken({ user_id: 42, exp: freshExp() }));
    expect(getStoredTokenUserId()).toBe(42);
  });

  it('returns null when no token is stored', () => {
    expect(getStoredTokenUserId()).toBeNull();
  });

  it('returns null when the token cannot be decoded', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    localStorage.setItem('token', 'not-a-jwt');
    expect(getStoredTokenUserId()).toBeNull();
  });

  it('returns null when the token has no numeric user_id claim', () => {
    localStorage.setItem('token', makeToken({ exp: freshExp() }));
    expect(getStoredTokenUserId()).toBeNull();
  });
});

describe('tryRefreshToken', () => {
  it('short-circuits without a network call when the stored token is still fresh', async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);
    localStorage.setItem('token', makeToken({ user_id: 1, exp: freshExp() }));
    localStorage.setItem('refresh', 'refresh-token');

    await expect(tryRefreshToken()).resolves.toBe('ok');
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('exchanges the refresh token and stores the rotated pair when expired', async () => {
    const fetchSpy = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ access: 'new-access', refresh: 'new-refresh' }),
    });
    vi.stubGlobal('fetch', fetchSpy);
    localStorage.setItem('token', makeToken({ user_id: 1, exp: expiredExp() }));
    localStorage.setItem('refresh', 'old-refresh');

    await expect(tryRefreshToken()).resolves.toBe('ok');
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(fetchSpy.mock.calls[0][1].body).toBe(JSON.stringify({ refresh: 'old-refresh' }));
    expect(localStorage.getItem('token')).toBe('new-access');
    expect(localStorage.getItem('refresh')).toBe('new-refresh');
  });

  it("returns 'rejected' without a network call when expired and no refresh token exists", async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);
    localStorage.setItem('token', makeToken({ user_id: 1, exp: expiredExp() }));

    await expect(tryRefreshToken()).resolves.toBe('rejected');
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});
