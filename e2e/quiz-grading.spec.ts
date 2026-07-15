// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
//
// Staff manual-grading e2e, driven against the seeded `QT · Essay · manual grading` quiz
// (unlimited attempts, so this spec never starves the quiz-taking spec). The student
// submits an essay, the instructor grades / reopens / regrades it in the admin grading
// drawer, checks the Results tab, and the student sees the official score on their card.
// Instructor auth comes from the instructor storageState written by global.setup.ts.
import { test, expect, type Page } from '@playwright/test';
import { COURSE_NAME, COURSE_PERIOD } from './constants';
import { courseUrl, openQuiz, submitQuiz } from './helpers';

const adminQuizzesUrl = `/admin/${encodeURIComponent(COURSE_NAME)}/${encodeURIComponent(COURSE_PERIOD)}/quizzes`;
const QUIZ_TITLE = 'QT · Essay · manual grading';

/** Submit a fresh essay attempt as the student (default storageState). */
async function submitEssayAttempt(page: Page) {
  await openQuiz(page, QUIZ_TITLE);
  await page.getByTestId('quiz-answer-text').fill('A stack is LIFO; a queue is FIFO.');
  await submitQuiz(page);
  await expect(page.getByTestId('quiz-score')).toContainText('await grading');
}

test.describe('staff quiz grading', () => {
  test('instructor grades, reopens, and regrades an essay; results + student card update', async ({
    page,
    browser,
  }) => {
    await submitEssayAttempt(page);

    // ── Instructor: open the grading drawer from the quiz builder ──────────
    const ictx = await browser.newContext({ storageState: 'e2e/.auth/instructor.json' });
    const ipage = await ictx.newPage();
    await ipage.goto(adminQuizzesUrl);
    await ipage.getByRole('tab', { name: 'Quizzes' }).click();
    await ipage.getByRole('cell', { name: QUIZ_TITLE }).click();
    // The quiz page's Grading tab shows the needs-grading count in its label.
    await ipage.getByRole('tab', { name: /Grading \(\d+\)/ }).click();

    // Attempts tab (needs-grading only, on by default) lists the pending attempt.
    await ipage.getByTestId('grading-open-attempt').first().click();
    await expect(ipage.getByTestId('grading-attempt-score')).toBeVisible();

    // Grade the essay: 4 / 5 with feedback. (antd InputNumber may put the testid on the
    // wrapper or the inner input depending on version — accept either.)
    const pointsInput = ipage
      .locator('input[data-testid="grade-points"], [data-testid="grade-points"] input')
      .first();
    await pointsInput.fill('4');
    await ipage.getByTestId('grade-feedback').fill('Good work. Mention complexity next time.');
    await ipage.getByTestId('grade-save').click();
    await expect(ipage.getByTestId('grading-attempt-score')).toContainText(/4(\.0+)? \/ 5/);
    await expect(ipage.getByText('Passed', { exact: true })).toBeVisible(); // ≥ 3 points

    // Reopen the grade: back to the queue, score drops, feedback kept as a draft.
    await ipage.getByTestId('grade-reopen').click();
    await ipage.locator('.ant-popconfirm').getByRole('button', { name: 'Reopen' }).click();
    await expect(ipage.getByText('Awaiting manual grades')).toBeVisible();
    await expect(ipage.getByTestId('grading-attempt-score')).toContainText(/0(\.0+)? \/ 5/);
    await expect(ipage.getByTestId('grade-feedback')).toHaveValue(/Good work/);

    // Regrade at 4.5.
    await pointsInput.fill('4.5');
    await ipage.getByTestId('grade-save').click();
    await expect(ipage.getByTestId('grading-attempt-score')).toContainText(/4\.50? \/ 5/);

    // ── Results tab: official score row + CSV export enabled ───────────────
    await ipage.getByRole('button', { name: 'All attempts' }).click();
    await ipage.getByRole('tab', { name: 'Results' }).click();
    const row = ipage.getByTestId('results-table').locator('tr', { hasText: 'student_only@dev.edu' });
    await expect(row.getByTestId('result-score')).toHaveText('4.5 / 5');
    await expect(row.getByText('Passed')).toBeVisible();
    await expect(ipage.getByTestId('results-export')).toBeEnabled();

    // ── Item analysis tab: shows the essay averaging 90% ───────────────────
    await ipage.getByRole('tab', { name: 'Item analysis' }).click();
    const statRow = ipage
      .getByTestId('question-stats-table')
      .locator('tr', { hasText: 'stack' }); // essay stem mentions stack vs queue
    await expect(statRow.getByTestId('question-avg')).toHaveText('90%');
    await ictx.close();

    // ── Student: the card shows the official score and Review opens results ─
    await page.goto(`${courseUrl}/quizzes`);
    const card = page.getByTestId('student-quiz-card').filter({ hasText: QUIZ_TITLE });
    await expect(card.getByTestId('student-quiz-score')).toHaveText('4.5 / 5');
    await expect(card.getByText('Passed')).toBeVisible();

    // Unlimited attempts ⇒ the primary action is "New attempt"; the secondary Review
    // link must still reach past results and the grader's feedback.
    await expect(card.getByTestId('student-quiz-action')).toHaveText('New attempt');
    await card.getByTestId('student-quiz-review').click();
    await expect(page).toHaveURL(/\/quizzes\/\d+\/review/);
    await expect(page.getByTestId('quiz-results')).toBeVisible();
    await expect(page.getByTestId('quiz-score')).toContainText('4.5 / 5');
    await expect(page.getByTestId('quiz-grader-feedback')).toContainText('Good work');
  });
});
