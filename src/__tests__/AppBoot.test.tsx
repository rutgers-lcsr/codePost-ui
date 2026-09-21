// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { BrowserRouter } from 'react-router';
import {
  createApiClientsMock,
  createLocalStorageMock,
  installLocalStorageMock,
  restoreLocalStorage,
} from '../test-utils/mocks';

vi.mock('../api-client/clients', () => createApiClientsMock());

// The real LoginForm is SSO-gated (org lookup before the password field appears);
// a stub drives App's handleLogin branches directly and echoes the error it gets.
vi.mock('../components/pre-auth/LoginForm', () => ({
  default: ({
    handleLogin,
    error,
  }: {
    handleLogin: (email: string, password: string, redirect: boolean) => Promise<void>;
    error: string;
  }) => (
    <div>
      <button onClick={() => handleLogin('u@x.edu', 'pw', false).catch(() => undefined)}>stub-login</button>
      <div data-testid="login-error">{error}</div>
    </div>
  ),
}));

import { capabilitiesApi, registrationApi, tokenAuthApi } from '../api-client/clients';
import { ResponseError } from '../api-client/runtime';
import { API_UNAVAILABLE_MESSAGE } from '../lib/apiError';
import { mockUser } from '../test-utils/factories';
import App from '../App';

function buildJwt(payload: Record<string, unknown>): string {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  return `${header}.${btoa(JSON.stringify(payload))}.fake-signature`;
}
const validJwt = () => buildJwt({ user_id: 1, exp: Math.floor(Date.now() / 1000) + 3600 });
const responseError = (status: number) => new ResponseError({ status } as Response);

const { mock: lsMock, store } = createLocalStorageMock();

const renderApp = () =>
  render(
    <BrowserRouter>
      <App />
    </BrowserRouter>,
  );

const tick = async (ms: number) => {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(ms);
  });
};

beforeEach(() => {
  vi.useFakeTimers();
  installLocalStorageMock(lsMock);
  localStorage.clear();
  window.history.replaceState({}, '', '/');
  vi.mocked(registrationApi.currentUserRetrieve).mockReset();
  vi.mocked(tokenAuthApi.createRaw).mockReset();
  vi.mocked(capabilitiesApi.platformRetrieve).mockResolvedValue({ capabilitiesMap: {} } as any);
  vi.spyOn(console, 'log').mockImplementation(() => {});
});

afterEach(() => {
  vi.useRealTimers();
  restoreLocalStorage();
  vi.restoreAllMocks();
});

describe('App boot with a stored token while the API is unavailable', () => {
  it('keeps retrying past the old 4-attempt cap and loads once the API answers', async () => {
    store['token'] = validJwt();
    store['refresh'] = 'refresh-token';
    vi.mocked(registrationApi.currentUserRetrieve).mockRejectedValue(responseError(503));

    renderApp();
    await tick(0);
    expect(screen.getByText('Connecting to codePost…')).toBeInTheDocument();

    // Backoff 1s, 2s, 4s, 8s, then a 10s cap — 60s is well past four attempts.
    await tick(60_000);
    expect(vi.mocked(registrationApi.currentUserRetrieve).mock.calls.length).toBeGreaterThan(5);
    expect(screen.getByText('Connecting to codePost…')).toBeInTheDocument();
    expect(screen.queryByText(/email and password/i)).toBeNull();
    expect(localStorage.getItem('token')).toBeTruthy();

    vi.mocked(registrationApi.currentUserRetrieve).mockResolvedValue({
      ...mockUser,
      courseadminCourses: [],
      canCreateCourses: false,
      isOrgStaff: false,
      token: store['token'],
    } as any);
    await tick(10_000);
    expect(screen.queryByText('Connecting to codePost…')).toBeNull();
    expect(localStorage.getItem('token')).toBeTruthy();
  });
});

describe('App login failures', () => {
  const loginWith = async (error: unknown) => {
    window.history.replaceState({}, '', '/login');
    vi.mocked(tokenAuthApi.createRaw).mockRejectedValue(error);
    renderApp();
    await tick(0);
    fireEvent.click(screen.getByText('stub-login'));
    await tick(0);
    return screen.getByTestId('login-error').textContent;
  };

  it('shows the outage message, not "invalid", when the API is unavailable', async () => {
    expect(await loginWith(responseError(503))).toBe(API_UNAVAILABLE_MESSAGE);
  });

  it('shows "invalid" on rejected credentials', async () => {
    expect(await loginWith(responseError(401))).toBe('invalid');
  });
});
