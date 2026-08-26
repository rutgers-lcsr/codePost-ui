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
import { resolveCourseId, resolveEssayQuizId, seedQuizGrading, seedSectionsAndGraders } from './seed';

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

/** A fresh JWT for a role the saved auth states don't cover (DEBUG-only dev endpoint). */
async function tokenAsRole(role: string): Promise<string> {
  const api = await request.newContext({ baseURL: API_URL });
  const resp = await api.post('/dev-auth/login-as/', { data: { role } });
  expect(resp.ok(), `dev-auth/login-as ${role} failed (${resp.status()})`).toBeTruthy();
  const token = (await resp.json()).token as string;
  await api.dispose();
  return token;
}

// NOTE: run the whole project, not `-g <one shot>`. The setup project reseeds (which wipes
// quiz attempts) on every run, and a -g filter drops the fixtures test below with it, so the
// grading shots would then open an empty queue.
//
// Fixtures the global setup doesn't cover: the demo course has no sections and
// seed_test_quizzes clears every attempt, so the sections matrix and both quiz grading
// shots would capture empty states. Runs first — the config is workers: 1, serial.
test('docs fixtures: sections, graders, and a quiz grading queue', async ({ browser }) => {
  test.setTimeout(180_000);
  const instructorApi = await request.newContext({
    baseURL: API_URL,
    extraHTTPHeaders: { Authorization: `Bearer ${await tokenFor('instructor')}` },
  });
  const graderApi = await request.newContext({
    baseURL: API_URL,
    extraHTTPHeaders: { Authorization: `Bearer ${await tokenAsRole('grader_basic')}` },
  });
  try {
    const courseId = await resolveCourseId(instructorApi);
    await seedSectionsAndGraders(instructorApi, courseId);
    await seedQuizGrading(browser, graderApi, await resolveEssayQuizId(instructorApi, courseId));
  } finally {
    await instructorApi.dispose();
    await graderApi.dispose();
  }
});

for (const shot of DOC_SHOTS) {
  test(`docs screenshot: ${shot.file}`, async ({ browser }) => {
    const context = await browser.newContext({
      viewport: VIEWPORT,
      deviceScaleFactor: 2,
      ...(shot.auth !== 'none' ? { storageState: authFile(shot.auth) } : {}),
    });
    // Hide dev-server chrome (DevPanel tab, react-query devtools) in every shot.
    await context.addInitScript(() => {
      try {
        window.localStorage.setItem('codepost:hide-dev-tools', '1');
      } catch {
        /* storage unavailable — dev chrome will show, better than failing the run */
      }
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
