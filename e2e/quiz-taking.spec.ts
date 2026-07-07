// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
//
// Student quiz-taking e2e, driven against the seeded `QT · ` quizzes (see
// core/management/commands/seed_test_quizzes.py). Auth comes from the student storageState
// written by global.setup.ts. Correct answers are the seed's:
//   2+2 → 4 · primes → 2 & 3 · "Earth is flat" → False · capital of France → Paris · √144 → 12
import { test, expect, type Page } from '@playwright/test';
import { COURSE_NAME, COURSE_PERIOD } from './constants';

const courseUrl = `/student/${encodeURIComponent(COURSE_NAME)}/${encodeURIComponent(COURSE_PERIOD)}`;

/** Open a standalone quiz from the course view's Quizzes page by (partial) title. */
async function openQuiz(page: Page, titleFragment: string) {
  await page.goto(`${courseUrl}/quizzes`);
  const card = page.getByTestId('student-quiz-card').filter({ hasText: titleFragment });
  await card.getByTestId('student-quiz-action').click();
  await expect(page.getByTestId('quiz-taking')).toBeVisible();
}

type Scope = Page | ReturnType<Page['locator']>;

/** The question card of a given type (e.g. within a one-page quiz). */
function questionOfType(page: Page, type: string) {
  return page.locator(`[data-question-type="${type}"]`);
}

/** Click a choice (radio/checkbox) by its exact visible text, within a question scope.
 *  Clicking the label reliably toggles antd radios AND checkboxes. */
async function pickChoice(scope: Scope, text: string) {
  await scope.getByTestId('quiz-choice').filter({ hasText: new RegExp(`^${text}$`) }).click();
}

/** Answer the five auto-graded questions of a one-page quiz correctly. */
async function answerAutoCorrect(page: Page) {
  await pickChoice(questionOfType(page, 'multiple_choice'), '4');
  await pickChoice(questionOfType(page, 'multiple_answers'), '2');
  await pickChoice(questionOfType(page, 'multiple_answers'), '3');
  await pickChoice(questionOfType(page, 'true_false'), 'False');
  await questionOfType(page, 'short_answer').getByTestId('quiz-answer-text').fill('Paris');
  await questionOfType(page, 'numerical').getByTestId('quiz-answer-text').fill('12');
}

/** Answer whichever single question is on screen (sequential mode), correctly. */
async function answerCurrentSequential(page: Page) {
  const question = page.getByTestId('quiz-question');
  const type = await question.getAttribute('data-question-type');
  switch (type) {
    case 'multiple_choice':
      await pickChoice(question, '4');
      break;
    case 'multiple_answers':
      await pickChoice(question, '2');
      await pickChoice(question, '3');
      break;
    case 'true_false':
      await pickChoice(question, 'False');
      break;
    case 'short_answer':
      await question.getByTestId('quiz-answer-text').fill('Paris');
      break;
    case 'numerical':
      await question.getByTestId('quiz-answer-text').fill('12');
      break;
  }
}

/** Click Submit and confirm the Popconfirm, then wait for the results screen. */
async function submitQuiz(page: Page) {
  await page.getByTestId('quiz-submit').click();
  await page.getByRole('button', { name: 'Submit', exact: true }).click();
  await expect(page.getByTestId('quiz-results')).toBeVisible();
}

test.describe('student quiz taking', () => {
  test('every answer input renders, and a mixed quiz submits as pending grading', async ({ page }) => {
    await openQuiz(page, 'QT · All question types');

    await answerAutoCorrect(page);
    await page.locator('[data-question-type="essay"] [data-testid="quiz-answer-text"]').fill('A stack is LIFO; a queue is FIFO.');
    // The code editor (Monaco) renders with the starter code pre-filled — just confirm it's there.
    await expect(page.locator('[data-question-type="code"] [data-testid="quiz-answer-code"]')).toBeVisible();

    await submitQuiz(page);
    // Essay + code ⇒ manual grading, so no numeric score yet.
    await expect(page.getByTestId('quiz-score')).toContainText('await grading');
  });

  test('auto-graded answers score full marks and pass', async ({ page }) => {
    await openQuiz(page, 'QT · Unlimited attempts · points pass');
    await answerAutoCorrect(page);
    await submitQuiz(page);

    await expect(page.getByTestId('quiz-score')).toContainText('10 / 10');
    await expect(page.getByTestId('quiz-result-status')).toContainText('Passed');
  });

  test('an empty submission scores zero and does not pass', async ({ page }) => {
    await openQuiz(page, 'QT · Unlimited attempts · points pass');
    await submitQuiz(page); // submit with nothing answered

    await expect(page.getByTestId('quiz-score')).toContainText('0 / 10');
    await expect(page.getByTestId('quiz-result-status')).toContainText('Did not pass');
  });

  test('a timed sequential quiz shows a running timer and steps through questions', async ({ page }) => {
    await openQuiz(page, 'QT · Timed · sequential · 3 attempts');

    // Timer is visible and actually ticking (value changes) — no fixed sleeps.
    const timer = page.getByTestId('quiz-timer');
    await expect(timer).toBeVisible();
    await expect(timer).toHaveText(/\d+:\d\d/);
    const first = await timer.textContent();
    await expect.poll(async () => (await timer.textContent()) !== first, { timeout: 4000 }).toBe(true);

    // One question at a time, no going back: answer each and advance until the last.
    for (let i = 0; i < 5; i++) {
      await answerCurrentSequential(page);
      const next = page.getByTestId('quiz-next');
      if (await next.isVisible()) {
        await next.click();
      }
    }
    await submitQuiz(page);
    await expect(page.getByTestId('quiz-score')).toContainText('10 / 10');
  });

  test('a not-yet-open attached quiz shows as locked on its assignment', async ({ page }) => {
    await page.goto(courseUrl);

    // The "[Attached · LOCKED] waiting for feedback" quiz is on the open assignment but opens
    // only after feedback (not released) → it must render locked with a reason, no start button.
    const lockedRow = page.getByTestId('attached-quiz-row').filter({ hasText: 'LOCKED' });
    await expect(lockedRow.getByTestId('attached-quiz-locked')).toBeVisible();
    await expect(lockedRow.getByTestId('attached-quiz-locked')).toContainText('feedback');
    await expect(lockedRow.getByTestId('attached-quiz-action')).toHaveCount(0);
  });
});
