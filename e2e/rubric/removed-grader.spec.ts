// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
//
// A grader removed from the roster by a course admin loses access to the submissions they were
// assigned (isStaffOfSub: the assigned grader only counts while still a grader of the course).
import { test, expect } from '@playwright/test';
import { adminBase, apiAs, seedRubricData, signIn } from './helpers';

test.use({ storageState: { cookies: [], origins: [] }, viewport: { width: 1500, height: 1000 } });

test('removing a grader from the roster in the admin UI revokes their access to their assigned submission', async ({
  page,
  browser,
}) => {
  const seed = seedRubricData();
  const grader = await apiAs({ token: seed.g2Token });

  // Before: the assigned grader opens the submission through the API.
  expect((await grader.get(`/submissions/${seed.g2Submission}/`)).status()).toBe(200);

  // The admin unenrolls them on the Graders roster page.
  const adminContext = await browser.newContext({ viewport: { width: 1500, height: 1000 } });
  // Roster edits need Profile.canModifyRosters (or a superuser); the seeded course admin does not have it.
  await signIn(adminContext, 'staff');
  const admin = await adminContext.newPage();
  await admin.goto(`${adminBase}/roster/graders`);
  await admin.getByRole('button', { name: 'Unenroll rb_grader2@dev.edu' }).click({ timeout: 60_000 });
  const removed = admin.waitForResponse((r) => /removeFromRoster/.test(r.url()));
  await admin.getByRole('dialog').getByRole('button', { name: 'Remove' }).click();
  expect((await removed).ok()).toBeTruthy();
  await expect(admin.getByRole('button', { name: 'Unenroll rb_grader2@dev.edu' })).toHaveCount(0);
  await adminContext.close();

  // After: the API refuses the removed grader (submission.grader is still them, the course no longer lists them).
  const refused = await grader.get(`/submissions/${seed.g2Submission}/`);
  expect([403, 404]).toContain(refused.status());
  expect(await (await grader.get(`/submissions/${seed.g2Submission}/checkPermission/`)).json()).toMatchObject({
    read: false,
    write: false,
  });

  // ... and so does the grading console.
  const graderContext = await browser.newContext({ viewport: { width: 1500, height: 1000 } });
  await signIn(graderContext, { token: seed.g2Token });
  const consolePage = await graderContext.newPage();
  const checked = consolePage.waitForResponse((r) => r.request().method() === 'GET' && /\/checkPermission\/$/.test(r.url()));
  await consolePage.goto(`/code/${seed.g2Submission}`);
  expect(await (await checked).json()).toMatchObject({ read: false, write: false });
  await expect(consolePage.locator('#line-0')).toHaveCount(0, { timeout: 20_000 });
  await expect(consolePage.getByText('return 1')).toHaveCount(0);
  await graderContext.close();
});
