// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
//
// Grading flow end to end: a grader claims from the queue, grades with a rubric comment and
// finalizes; the admin releases feedback; the student sees it with isApplied hidden.
import { test, expect } from '@playwright/test';
import { apiAs, enc, graderBase, seedRubricData, setGraderRubricEditing, signIn } from './helpers';

test.use({ storageState: { cookies: [], origins: [] }, viewport: { width: 1500, height: 1000 } });

test('a grader claims, grades with a rubric comment and finalizes; after release the student sees the feedback', async ({
  page,
  context,
}) => {
  const seed = seedRubricData();
  await setGraderRubricEditing(seed.courseId, true);
  const admin = await apiAs('course_admin');
  const student = await apiAs({ token: seed.s2Token });

  // 1. Claim from the queue (opens the console in a new tab).
  await signIn(context, 'grader_basic');
  await page.goto(`${graderBase}/my_submissions/${enc('RB Flow')}`);
  const consoleOpened = context.waitForEvent('page');
  await page.getByRole('button', { name: /Grade next/ }).click();
  const grade = await consoleOpened;
  await expect(grade.locator('#line-0')).toBeVisible({ timeout: 60_000 });
  const submissionId = Number(new URL(grade.url()).pathname.split('/').pop());
  const claimed = await (await admin.get(`/submissions/${submissionId}/`)).json();
  expect(claimed.grader).toBe('grader_basic@dev.edu');
  expect(claimed.isFinalized).toBe(false);

  // 2. Open the rubric panel, highlight a line, apply a rubric comment.
  await grade.getByRole('img', { name: 'book' }).click();
  await expect(grade.getByTestId('rubric-panel')).toBeVisible();
  await grade.locator('#line-1').click({ clickCount: 3 });
  await grade.getByTestId('rubric-panel').getByText('RB applied criterion', { exact: true }).click();
  await expect(grade.getByText('RB Correctness | RB applied criterion')).toBeVisible();

  // 3. Finalize.
  const finalized = grade.waitForResponse((r) => ['PATCH', 'PUT'].includes(r.request().method()) && /\/submissions\/\d+\//.test(r.url()));
  await grade.getByRole('switch', { name: 'Click to Finalize' }).click();
  // The course wants two comments per submission; finalizing with one asks for confirmation.
  await grade.getByRole('dialog').getByRole('button', { name: 'OK' }).click();
  expect((await finalized).ok()).toBeTruthy();
  await expect(grade.getByText('finalized but not published')).toBeVisible();
  const done = await (await admin.get(`/submissions/${submissionId}/`)).json();
  expect(done.isFinalized).toBe(true);
  expect(Number(done.grade)).toBe(95);

  // 4. Before release the student sees no grade, comments or rubric.
  const before = await (await student.get(`/submissions/${submissionId}/`)).json();
  expect(before.grade, 'grade hidden before release').toBeNull();
  expect(before.files[0].comments, 'comments hidden before release').toEqual([]);
  expect((await student.get(`/assignments/${seed.flow}/rubric/`)).status()).toBe(403);

  // 5. The admin releases feedback; the student now sees it.
  const release = await admin.patch(`/assignments/${seed.flow}/`, { data: { feedbackStatus: 'released' } });
  expect(release.ok(), await release.text()).toBeTruthy();
  const seen = await student.get(`/submissions/${submissionId}/`);
  expect(seen.ok(), await seen.text()).toBeTruthy();
  const after = await seen.json();
  expect(Number(after.grade)).toBe(95);
  expect(after.files[0].comments).toHaveLength(1);
  const rubric = await (await student.get(`/assignments/${seed.flow}/rubric/`)).json();
  expect(rubric.rubricComments.length).toBeGreaterThanOrEqual(2);
  for (const c of rubric.rubricComments) expect(c.isApplied).toBeNull();

  const studentPage = await context.newPage();
  await signIn(context, { token: seed.s2Token });
  await studentPage.goto(`/code/${submissionId}`);
  await expect(studentPage.getByText('RB applied criterion').first()).toBeVisible({ timeout: 60_000 });
});
