// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
//
// Shared helpers for the quiz e2e specs. The retry loops harden against a click landing
// mid-re-render (the debounced autosave of a previous answer) and getting swallowed.
import { expect, type Page } from '@playwright/test';
import { COURSE_NAME, COURSE_PERIOD } from './constants';

export const courseUrl = `/student/${encodeURIComponent(COURSE_NAME)}/${encodeURIComponent(COURSE_PERIOD)}`;

export type Scope = Page | ReturnType<Page['locator']>;

/** Open a standalone quiz from the course view's Quizzes page by (partial) title. */
export async function openQuiz(page: Page, titleFragment: string) {
  await page.goto(`${courseUrl}/quizzes`);
  const card = page.getByTestId('student-quiz-card').filter({ hasText: titleFragment });
  await card.getByTestId('student-quiz-action').click();
  await expect(page.getByTestId('quiz-taking')).toBeVisible();
}

/** Click a choice (radio/checkbox) by its exact visible text, within a question scope.
 *  Clicking the label reliably toggles antd radios AND checkboxes. A click can land
 *  mid-re-render (the debounced autosave of the previous answer) and get swallowed,
 *  so verify the control actually toggled and retry if it didn't. */
export async function pickChoice(scope: Scope, text: string) {
  const choice = scope.getByTestId('quiz-choice').filter({ hasText: new RegExp(`^${text}$`) });
  const input = choice.locator('xpath=ancestor::label//input');
  await expect(async () => {
    if (!(await input.isChecked())) {
      await choice.click();
    }
    await expect(input).toBeChecked({ timeout: 1000 });
  }).toPass({ timeout: 30000 });
}

/** Click Submit and confirm the Popconfirm, then wait for the results screen. The submit
 *  click can land mid-re-render (debounced autosave) and get swallowed — same race as
 *  pickChoice — so retry until the confirm actually shows. */
export async function submitQuiz(page: Page) {
  const confirm = page.getByRole('button', { name: 'Submit', exact: true });
  await expect(async () => {
    if (!(await confirm.isVisible())) {
      await page.getByTestId('quiz-submit').click();
    }
    await expect(confirm).toBeVisible({ timeout: 2000 });
  }).toPass({ timeout: 15000 });
  await confirm.click();
  await expect(page.getByTestId('quiz-results')).toBeVisible();
}
