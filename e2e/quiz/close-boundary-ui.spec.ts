// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
//
// The student's view of the quiz close: a quiz about to close shows a countdown, the attempt is
// sealed when the close is reached, and the quiz card then reads as closed with only review is offered.
import { test, expect, type APIRequestContext } from '@playwright/test';
import { BASE_URL } from '../constants';
import { courseUrl } from '../helpers';
import { apiAs, loginAs, seed, type Seed } from './helpers';

let s: Seed;
let admin: APIRequestContext;

test.beforeAll(async () => {
  s = seed('boundary', 'EQZ-ui ', 's1');
  admin = await apiAs(await loginAs('course_admin'));
});

test.afterAll(async () => {
  await admin.dispose();
});

test('the taking screen counts down to the close, seals the attempt, and the card shows closed', async ({ page }) => {
  test.setTimeout(120_000);
  const closeAt = new Date(Date.now() + 40_000).toISOString();
  const patched = await admin.patch(`/quizzes/${s.standalone}/`, { data: { availableUntil: closeAt } });
  expect(patched.ok()).toBeTruthy();

  await page.addInitScript(([origin, token]) => {
    if (location.origin === origin) localStorage.setItem('token', token);
  }, [BASE_URL, s.tokens.s1]);
  await page.goto(`${courseUrl}/quizzes`);
  const card = page.getByTestId('student-quiz-card').filter({ hasText: 'EQZ-ui standalone' });
  await card.getByTestId('student-quiz-action').click();
  await expect(page.getByTestId('quiz-taking')).toBeVisible();
  await expect(page.getByTestId('quiz-timer')).toHaveText(/0:\d\d/);

  // At the close the attempt is submitted for the student; no answer needed.
  await expect(page.getByTestId('quiz-results')).toBeVisible({ timeout: 90_000 });

  await page.goto(`${courseUrl}/quizzes`);
  const closed = page.getByTestId('student-quiz-card').filter({ hasText: 'EQZ-ui standalone' });
  await expect(closed).toContainText(/closed/i);
  await expect(closed.getByTestId('student-quiz-action')).toHaveText('Review results');
});
