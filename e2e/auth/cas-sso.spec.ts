// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
//
// CAS single sign-on against a REAL local CAS server (Apereo CAS in docker, https://localhost:8443,
// casuser / Mellon; the API must trust its certificate). Covers the LoginForm SSO path, the
// browser-bound `state` (login CSRF refusal), the OAuth consent bridge (/auth/agent-login/ ->
// CAS -> /o/authorize) and the duplicate-email SSO check.
//
// Service tickets live ~10 s and the SSO throttle is 20/min per IP, so every test claims its own
// client IP (ownClientIp) and the attacker hop is kept short.
import { test, expect, type Browser, type BrowserContext, type Page } from '@playwright/test';
import { createHash, randomBytes } from 'node:crypto';
import { API_URL, BASE_URL } from '../constants';
import {
  CAS_EMAIL,
  CAS_PASSWORD,
  CAS_USER,
  ownClientIp,
  pyShell,
  seedCasOrg,
  freshIpHeader,
  uniqueEmail,
} from './helpers';

test.use({ storageState: { cookies: [], origins: [] }, ignoreHTTPSErrors: true });

let orgId: number;
test.beforeAll(() => {
  orgId = seedCasOrg().orgId;
});

async function newBrowserContext(browser: Browser): Promise<BrowserContext> {
  const ctx = await browser.newContext({ ignoreHTTPSErrors: true, storageState: { cookies: [], origins: [] } });
  await ownClientIp(ctx);
  return ctx;
}

async function casLogin(page: Page) {
  await expect(page).toHaveURL(/localhost:8443\/cas\/login/);
  await page.locator('#username').fill(CAS_USER);
  await page.locator('#password').fill(CAS_PASSWORD);
  await page.getByRole('button', { name: 'Login' }).click();
}

const token = (page: Page) => page.evaluate(() => localStorage.getItem('token'));

test.describe('CAS SSO', () => {
  test('LoginForm hands the SSO email to CAS with a browser-bound state and returns logged in', async ({
    browser,
  }) => {
    const ctx = await newBrowserContext(browser);
    const page = await ctx.newPage();
    await page.goto('/login');
    await page.getByPlaceholder('Email address').fill(CAS_EMAIL);
    await page.getByRole('button', { name: 'Continue' }).click();

    await expect(page).toHaveURL(/localhost:8443\/cas\/login/);
    const service = new URL(page.url()).searchParams.get('service');
    expect(service).toBeTruthy();
    const serviceUrl = new URL(service as string);
    expect(serviceUrl.pathname).toBe('/auth/sso/callback/CAS/');
    expect(serviceUrl.searchParams.get('org')).toBe(String(orgId));
    expect(serviceUrl.searchParams.get('state')).toMatch(/^[\w-]{20,}$/);

    await casLogin(page);
    await page.waitForURL(`${BASE_URL}/**`);
    await expect.poll(() => token(page), { timeout: 30_000 }).toBeTruthy();
    await expect(page.getByPlaceholder('Email address')).toHaveCount(0);
    await ctx.close();
  });

  test('a ticket from the attacker browser logs nobody in elsewhere (login CSRF)', async ({ browser }) => {
    // Attacker: starts a login, signs in at CAS, but never lets the callback run.
    const attackerCtx = await newBrowserContext(browser);
    const attacker = await attackerCtx.newPage();
    let capturedCallback = '';
    // Hold the redirect CAS answers its login POST with: that Location is the attacker's callback URL.
    await attacker.route('https://localhost:8443/cas/login**', async (route) => {
      if (route.request().method() !== 'POST') return route.continue();
      const response = await route.fetch({ maxRedirects: 0 });
      const location = response.headers().location ?? '';
      if (location.includes('/auth/sso/callback/')) {
        capturedCallback = location;
        return route.fulfill({ status: 200, contentType: 'text/html', body: 'held' });
      }
      return route.fulfill({ response });
    });
    await attacker.goto(`${API_URL}/auth/sso/login/CAS/?org=${orgId}`);
    await casLogin(attacker);
    await expect.poll(() => capturedCallback, { timeout: 30_000 }).toContain('ticket=');
    expect(capturedCallback).toContain('state=');

    // Victim 1: never started a login at all.
    const victimCtx = await newBrowserContext(browser);
    const noLogin = await victimCtx.request.get(capturedCallback, { maxRedirects: 0 });
    expect(noLogin.status()).toBe(302);
    expect(noLogin.headers().location).toContain('error=');
    expect(decodeURIComponent(noLogin.headers().location)).toContain('State parameter was not issued to this browser');
    expect(noLogin.headers().location).not.toContain('token=');

    // Victim 2: started their own login (has a session with a state), opens the attacker's URL.
    const ownStart = await victimCtx.request.get(`${API_URL}/auth/sso/login/CAS/?org=${orgId}`, {
      maxRedirects: 0,
    });
    expect(ownStart.status()).toBe(302);
    const victim = await victimCtx.newPage();
    await victim.goto(capturedCallback);
    await victim.waitForLoadState('domcontentloaded');
    expect(victim.url()).not.toContain('token=');
    expect(await token(victim)).toBeNull();
    // Still logged out: the landing page or the login form, never a dashboard.
    await expect(victim.getByRole('link', { name: 'Login' }).or(victim.getByPlaceholder('Email address'))).toBeVisible()

    await victimCtx.close();
    await attackerCtx.close();
  });

  test('the genuine browser can still finish the same flow it started (control for the CSRF test)', async ({
    browser,
  }) => {
    const ctx = await newBrowserContext(browser);
    const page = await ctx.newPage();
    await page.goto(`${API_URL}/auth/sso/login/CAS/?org=${orgId}`);
    await casLogin(page);
    await expect.poll(() => token(page), { timeout: 30_000 }).toBeTruthy();
    await ctx.close();
  });

  test('the agent-login page sends a CAS user through CAS to the /o/authorize consent page with a session', async ({
    browser,
  }) => {
    const pkceChallenge = createHash('sha256').update(randomBytes(32)).digest('base64url');
    const { clientId } = pyShell<{ clientId: string }>(`
from django.core.management import call_command
from oauth2_provider.models import Application
call_command('seed_oauth_application')
emit({'clientId': Application.objects.get(name='Claude (fallback)').client_id})
`);
    const authorize =
      `/o/authorize/?response_type=code&client_id=${clientId}&redirect_uri=${encodeURIComponent('http://localhost/callback')}` +
      `&code_challenge=${pkceChallenge}&code_challenge_method=S256&scope=read&state=e2e` +
      `&resource=${encodeURIComponent(`${API_URL}/mcp`)}`;

    const ctx = await newBrowserContext(browser);
    const page = await ctx.newPage();
    await page.goto(`${API_URL}/auth/agent-login/?next=${encodeURIComponent(authorize)}`);
    await page.locator('#email').fill(CAS_EMAIL);
    await page.locator('input[type=submit]').click();
    await page.getByRole('link', { name: /Continue with CAS/ }).click();

    await expect(page.url()).toContain('service=');
    expect(decodeURIComponent(page.url())).toContain('&state=');
    await casLogin(page);

    await expect(page).toHaveURL(/\/o\/authorize\//, { timeout: 30_000 });
    await expect(page.getByRole('heading', { name: /Allow .* to access codePost/ })).toBeVisible();
    expect((await ctx.cookies(API_URL)).some((c) => c.name === 'sessionid')).toBe(true);
    await ctx.close();
  });
});

test.describe('SSO availability check', () => {
  test('an email shared by two accounts answers cleanly instead of failing', async ({ request }) => {
    // Neither account's domain maps to an org, so the check must not guess between them.
    const email = uniqueEmail('dup').replace('@dev.edu', '@nowhere.test');
    pyShell(`
from django.contrib.auth.models import User
for name in ('a', 'b'):
    User.objects.create(username=name + ${JSON.stringify(email)}, email=${JSON.stringify(email)})
emit(True)
`);
    const res = await request.get(`${API_URL}/auth/sso/check/`, {
      params: { email },
      headers: freshIpHeader(),
    });
    expect(res.status()).toBe(200);
    expect(await res.json()).toEqual({ sso_enabled: false });

    // ...and the redirect leg answers a clean 4xx with a message, not a 500.
    const login = await request.get(`${API_URL}/auth/sso/login/CAS/`, {
      params: { email },
      headers: freshIpHeader(),
      maxRedirects: 0,
    });
    expect(login.status()).toBe(400);
    expect((await login.json()).error).toBeTruthy();
  });

  test('a callback for an org with SSO off, or the wrong provider, is refused without a login', async ({
    request,
  }) => {
    const res = await request.get(`${API_URL}/auth/sso/callback/CAS/`, {
      params: { org: '1', ticket: 'ST-bogus', state: 'x' },
      headers: freshIpHeader(),
      maxRedirects: 0,
    });
    expect(res.status()).toBe(302);
    const location = decodeURIComponent(res.headers().location);
    expect(location).toContain('error=SSO is not enabled for this organization');
    expect(location).not.toContain('token=');
  });
});
