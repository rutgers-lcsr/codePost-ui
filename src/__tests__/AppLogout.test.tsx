// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, act } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { BrowserRouter } from 'react-router';
import {
  createApiClientsMock,
  createLocalStorageMock,
  installLocalStorageMock,
  restoreLocalStorage,
} from '../test-utils/mocks';

vi.mock('../api-client/clients', () => createApiClientsMock());

// handleLogout runs `logout()` once per sign-out. Counting its calls detects the loop; throwing past a
// ceiling stops a runaway loop from hanging the test run (React would otherwise re-render forever).
const logoutCalls = vi.hoisted(() => ({ n: 0 }));
vi.mock('../utils/auth', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../utils/auth')>()),
  logout: vi.fn(() => {
    logoutCalls.n += 1;
    if (logoutCalls.n > 25) throw new Error('logout loop: handleLogout re-ran 25+ times');
    return Promise.resolve();
  }),
}));

import { capabilitiesApi, registrationApi } from '../api-client/clients';
import { mockUser } from '../test-utils/factories';
import App from '../App';

function buildJwt(payload: Record<string, unknown>): string {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  return `${header}.${btoa(JSON.stringify(payload))}.fake-signature`;
}
const validJwt = () => buildJwt({ user_id: 1, exp: Math.floor(Date.now() / 1000) + 3600 });

const { mock: lsMock, store } = createLocalStorageMock();

const tick = async (ms: number) => {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(ms);
  });
};

beforeEach(() => {
  logoutCalls.n = 0;
  vi.useFakeTimers();
  installLocalStorageMock(lsMock);
  localStorage.clear();
  window.history.replaceState({}, '', '/');
  vi.mocked(registrationApi.currentUserRetrieve).mockReset();
  vi.mocked(capabilitiesApi.platformRetrieve).mockResolvedValue({ capabilitiesMap: {} } as any);
  vi.spyOn(console, 'log').mockImplementation(() => {});
});

afterEach(() => {
  vi.useRealTimers();
  restoreLocalStorage();
  vi.restoreAllMocks();
});

describe('visiting /logout while signed in', () => {
  it('signs out once and settles on / without a render loop', async () => {
    const errors = vi.spyOn(console, 'error').mockImplementation(() => {});
    store['token'] = validJwt();
    store['refresh'] = 'refresh-token';
    window.history.replaceState({}, '', '/logout');
    vi.mocked(registrationApi.currentUserRetrieve).mockResolvedValue({
      ...mockUser,
      studentCourses: [],
      graderCourses: [],
      superGraderCourses: [],
      courseadminCourses: [],
      canCreateCourses: false,
      token: store['token'],
    } as any);

    render(
      <BrowserRouter>
        <App />
      </BrowserRouter>,
    );
    await tick(0);
    await tick(5_000);

    const loops = errors.mock.calls.filter((c) => String(c[0]).includes('Maximum update depth'));
    expect(loops).toHaveLength(0);
    // One sign-out (the real logout() also clears the tokens), not a cycle.
    expect(logoutCalls.n).toBe(1);
    expect(window.location.pathname).toBe('/');
  });
});
