// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
//
// Safe Exam Browser lockdown e2e, driven against the seeded `QT · Safe Exam Browser
// required` quiz (see core/management/commands/seed_test_quizzes.py — its Config Key is
// the all-zero placeholder below). simulateSeb stamps the per-URL SEB header the way the
// real SEB client does; without it the API hard-blocks the taking endpoints.
import { test, expect } from '@playwright/test';
import { courseUrl, openQuiz, pickChoice, simulateSeb, submitQuiz } from './helpers';

const SEB_QUIZ = 'QT · Safe Exam Browser required';
const SEED_CONFIG_KEY = '0'.repeat(64);

test.describe('Safe Exam Browser lockdown', () => {
  test('outside SEB: card shows the requirement and starting hits the gate screen', async ({ page }) => {
    await page.goto(`${courseUrl}/quizzes`);
    const card = page.getByTestId('student-quiz-card').filter({ hasText: SEB_QUIZ });
    await expect(card.getByTestId('student-quiz-seb-tag')).toBeVisible();

    await card.getByTestId('student-quiz-action').click();
    // The start call 403s ({ lockdownRequired: true }) → the gate screen, not the quiz.
    await expect(page.getByText('Safe Exam Browser required').first()).toBeVisible();
    await expect(page.getByTestId('quiz-seb-launch')).toBeVisible();
    await expect(page.getByTestId('quiz-seb-retry')).toBeVisible();
    await expect(page.getByTestId('quiz-taking')).not.toBeVisible();

    // Retrying while still outside SEB stays blocked.
    await page.getByTestId('quiz-seb-retry').click();
    await expect(page.getByTestId('quiz-seb-retry')).toBeVisible();
    await expect(page.getByTestId('quiz-taking')).not.toBeVisible();
  });

  test('one-click launch: config is served and the OTT handoff logs the fresh session in', async ({
    page,
    context,
  }) => {
    await page.goto(`${courseUrl}/quizzes`);
    const card = page.getByTestId('student-quiz-card').filter({ hasText: SEB_QUIZ });
    await card.getByTestId('student-quiz-action').click();

    // Launch from the gate screen. Chromium has no seb:// handler, so the page stays put;
    // the config-download fallback appears with the tokenized config URL.
    await page.getByTestId('quiz-seb-launch').click();
    const configLink = page.getByRole('link', { name: 'Download the exam configuration' });
    await expect(configLink).toBeVisible();
    const configUrl = (await configLink.getAttribute('href'))!;

    // The config endpoint serves the .seb plist anonymously (SEB fetches before login).
    const configResp = await page.request.get(configUrl, { headers: { Authorization: '' } });
    expect(configResp.status()).toBe(200);
    const plist = await configResp.text();
    expect(plist).toContain('<key>startURL</key>');
    expect(plist).toContain('/seb/launch?ott=');

    // Simulate SEB opening the startURL in a FRESH session (no stored tokens): the
    // /seb/launch page exchanges the OTT and lands on the quiz as the student.
    const startUrl = plist.match(/<string>(http[^<]*\/seb\/launch[^<]*)<\/string>/)?.[1];
    expect(startUrl).toBeTruthy();
    const fresh = await context.browser()!.newContext();
    const sebPage = await fresh.newPage();
    await sebPage.goto(startUrl!.replace(/&amp;/g, '&'));
    await sebPage.waitForURL('**/quizzes/**/take');
    // No SEB headers in this simulated session, so the gate screen shows — but as the
    // logged-in student on the take route, proving the auth handoff worked.
    await expect(sebPage.getByTestId('quiz-seb-retry')).toBeVisible();
    await fresh.close();
  });

  test('inside SEB (simulated): the quiz can be taken and submitted', async ({ page }) => {
    await simulateSeb(page, SEED_CONFIG_KEY);
    await openQuiz(page, SEB_QUIZ);

    await pickChoice(page.locator('[data-question-type="multiple_choice"]'), '4');
    await pickChoice(page.locator('[data-question-type="multiple_answers"]'), '2');
    await pickChoice(page.locator('[data-question-type="multiple_answers"]'), '3');
    await pickChoice(page.locator('[data-question-type="true_false"]'), 'False');
    await page.locator('[data-question-type="short_answer"] [data-testid="quiz-answer-text"]').fill('Paris');
    await page.locator('[data-question-type="numerical"] [data-testid="quiz-answer-text"]').fill('12');

    await submitQuiz(page);
    await expect(page.getByTestId('quiz-score')).toBeVisible();
  });
});
