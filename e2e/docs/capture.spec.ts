// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
//
// Documentation screenshot harness. Renders each entry of e2e/docs/manifest.ts against
// the running dev stack and writes the PNG to public/assets/docs/ (the path the /docs
// markdown references). Run via `npm run docs:screenshots` — it needs the same running
// backend (DEBUG) + frontend as the quiz e2e suite, and the `setup` project seeds data
// and auth states first.
//
// Shots are deliberately deterministic: fixed viewport (1440x900 @2x), animations
// disabled, one test per image so a failure names the broken shot.
import { test, expect, request } from '@playwright/test';
import path from 'node:path';
import { API_URL, BASE_URL } from '../constants';
import { DOC_SHOTS } from './manifest';

const OUT_DIR = path.resolve(__dirname, '../../public/assets/docs');
const AUTH_DIR = path.resolve(__dirname, '../.auth');
const VIEWPORT = { width: 1440, height: 900 };

function authFile(auth: 'student' | 'instructor') {
  return path.join(AUTH_DIR, `${auth}.json`);
}

/** JWT for API-side resolution, read from the saved auth state. */
async function tokenFor(auth: 'student' | 'instructor'): Promise<string> {
  const state = require(authFile(auth));
  return state.origins[0].localStorage.find((e: { name: string }) => e.name === 'token').value;
}

for (const shot of DOC_SHOTS) {
  test(`docs screenshot: ${shot.file}`, async ({ browser }) => {
    const context = await browser.newContext({
      viewport: VIEWPORT,
      deviceScaleFactor: 2,
      ...(shot.auth !== 'none' ? { storageState: authFile(shot.auth) } : {}),
    });
    const page = await context.newPage();

    // Resolve dynamic routes through the API with the same identity.
    let target: string;
    if (typeof shot.path === 'function') {
      // Resolve with the instructor identity regardless of the browsing role — listing
      // an assignment's submissions requires staff.
      const api = await request.newContext({
        baseURL: API_URL,
        extraHTTPHeaders: { Authorization: `Bearer ${await tokenFor('instructor')}` },
      });
      target = await shot.path(api);
      await api.dispose();
    } else {
      target = shot.path;
    }

    await page.goto(`${BASE_URL}${target}`, { waitUntil: 'domcontentloaded' });
    if (shot.readySelector) {
      await expect(page.locator(shot.readySelector).first()).toBeVisible({ timeout: 30_000 });
    }
    await page.waitForLoadState('networkidle').catch(() => {});
    if (shot.prepare) await shot.prepare(page);
    // Let fonts/transitions settle; animations are disabled at capture time below.
    await page.waitForTimeout(500);

    const out = path.join(OUT_DIR, shot.file);
    if (shot.clipSelector) {
      const target = page.locator(shot.clipSelector).first();
      await expect(target).toBeVisible();
      await target.screenshot({ path: out, animations: 'disabled' });
    } else {
      await page.screenshot({ path: out, fullPage: shot.fullPage ?? false, animations: 'disabled' });
    }
    await context.close();
  });
}
