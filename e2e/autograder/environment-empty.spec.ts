// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
//
// An assignment with no environment (no assignment files uploaded yet, or one that never runs
// code, such as PDF-only work): the Environment & Tests page says so instead of loading
// forever, and the instructor can create an environment from there.
import { test, expect } from '@playwright/test';
import { COURSE_NAME, COURSE_PERIOD } from '../constants';
import { Api, ensureAssignment, loginAs } from './helpers';

test.use({ storageState: 'e2e/.auth/instructor.json' });
test.describe.configure({ timeout: 300_000 });

const NAME = 'AG E2E No Environment';
const editUrl = `/admin/${encodeURIComponent(COURSE_NAME)}/${encodeURIComponent(COURSE_PERIOD)}/assignments/environment/${encodeURIComponent(NAME)}/edit/environment`;

let admin: Api;
let assignmentId: number;

test.beforeAll(async () => {
  admin = new Api(await loginAs('course_admin'));
  // The assignment is reused across runs: remove the environment an earlier run created.
  const fixture = await ensureAssignment(admin, NAME);
  assignmentId = fixture.assignmentId;
  await admin.call('DELETE', `/autograder/environments/${fixture.envId}/`);
  expect((await admin.call('GET', `/assignments/${assignmentId}/`)).environment).toBeNull();
});

test('the page explains there is no environment and lets the instructor create one', async ({ page }) => {
  await page.goto(editUrl);
  const empty = page.getByTestId('environment-empty');
  await expect(empty).toBeVisible({ timeout: 60_000 });
  await expect(empty.getByText('This assignment has no environment')).toBeVisible();

  // The other tabs do not depend on an environment.
  await page.getByRole('tab', { name: 'Settings' }).click();
  await expect(page.getByText('Student Submit')).toBeVisible();
  await page.getByRole('tab', { name: 'Environment' }).click();

  await empty.getByRole('button', { name: 'Set up an environment' }).click();
  await expect(page.getByText('Environment Configuration')).toBeVisible({ timeout: 60_000 });
  await expect(page.getByText('Auto-Detect Enabled')).toBeVisible();
  await expect(empty).toHaveCount(0);

  const assignment = await admin.call('GET', `/assignments/${assignmentId}/`);
  expect(assignment.environment).not.toBeNull();
  const env = await admin.call('GET', `/autograder/environments/${assignment.environment}/`);
  expect(env.autoDetect).toBe(true);
});
