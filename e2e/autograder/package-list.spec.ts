// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
//
// The Auto-Detect panel's package list against real Docker builds: the packages shown are
// what the image was built from, an instructor can add one, every build lands in the version
// history, and a rollback restores the earlier image and list and keeps the package out.
import { test, expect } from '@playwright/test';
import { COURSE_NAME, COURSE_PERIOD } from '../constants';
import { Api, ensureAssignment, loginAs, manage, waitForBuild, type Json } from './helpers';

test.use({ storageState: 'e2e/.auth/instructor.json' });
test.describe.configure({ mode: 'serial', timeout: 900_000 });

const NAME = 'AG E2E Packages';
// Small pure-python packages: the builds here are real.
const DETECTED = 'tabulate';
const ADDED = 'colorama';

let admin: Api;
let envId: number;

const editUrl = `/admin/${encodeURIComponent(COURSE_NAME)}/${encodeURIComponent(COURSE_PERIOD)}/assignments/environment/${encodeURIComponent(NAME)}/edit/environment`;

const env = (): Promise<Json> => admin.call('GET', `/autograder/environments/${envId}/`);

test.beforeAll(async () => {
  admin = new Api(await loginAs('course_admin'));
  const fixture = await ensureAssignment(admin, NAME);
  envId = fixture.envId;

  // Start clean: the assignment is reused across runs, and so are its lists and history.
  const a = await admin.call('GET', `/assignments/${fixture.assignmentId}/`);
  for (const f of (a.files ?? []) as Json[])
    await admin.call('DELETE', `/assignmentFiles/${typeof f === 'number' ? f : f.id}/`);
  manage(
    `from core.models import Environment; Environment.objects.filter(pk=${envId}).update(` +
      'detected_requirements="", learned_packages=[], pinned_packages=[], excluded_packages=[], ' +
      'convergence_stats={}, image_history=[], current_build_version=1, built_requirements=None, ' +
      'rebuild_scheduled_at=None)',
  );
  await admin.call('PATCH', `/autograder/environments/${envId}/`, { autoDetect: true });

  // Detection (and the build it starts) runs inside the upload request, Celery being eager.
  await admin.call('POST', '/assignmentFiles/', {
    assignment: fixture.assignmentId,
    name: 'starter.py',
    data: `import ${DETECTED}\n`,
    extension: '.py',
    path: 'starter.py',
  });
  const build = await waitForBuild(admin, envId);
  expect(build.isSuccess, build.logs).toBe(true);
});

test('the panel lists the package detected from the instructor file, built into version 1', async ({ page }) => {
  const built = await env();
  expect(built.requirements).toBe(DETECTED);
  expect(built.imageOutOfDate).toBe(false);

  await page.goto(editUrl);
  await expect(page.getByText('Packages (1)', { exact: true })).toBeVisible({ timeout: 60_000 });
  await expect(page.getByText('From your files and tests')).toBeVisible();
  await expect(page.getByTestId('env-package').filter({ hasText: DETECTED })).toBeVisible();
  await expect(page.getByRole('button', { name: 'History (1)' })).toBeVisible();
  await expect(page.getByText('The image does not match this package list')).toHaveCount(0);
});

test('a misspelled package is refused with the reason', async ({ page }) => {
  await page.goto(editUrl);
  await page.getByLabel('Package to add').fill('tabulatee-no-such-package-zz');
  await page.getByRole('button', { name: 'Add package' }).click();
  await expect(page.getByText(/was not found on PyPI/)).toBeVisible({ timeout: 30_000 });
  expect((await env()).requirements).toBe(DETECTED);
});

test('adding a package rebuilds the image and records version 2', async ({ page }) => {
  await page.goto(editUrl);
  await page.getByLabel('Package to add').fill(ADDED);
  await page.getByRole('button', { name: 'Add package' }).click();

  // Celery is eager, so the queued rebuild runs inside the request.
  await expect(page.getByText('Added by you')).toBeVisible({ timeout: 600_000 });
  await expect(page.getByTestId('env-package').filter({ hasText: ADDED })).toBeVisible();
  await expect(page.getByRole('button', { name: 'History (2)' })).toBeVisible({ timeout: 600_000 });

  const rebuilt = await env();
  expect(rebuilt.requirements).toBe(`${ADDED}\n${DETECTED}`);
  expect(rebuilt.imageOutOfDate).toBe(false);
  expect(rebuilt.imageHistory.map((e: Json) => e.version)).toEqual([1, 2]);
  expect(rebuilt.imageName).toBe(rebuilt.imageHistory[1].image_name);
});

test('rolling back to version 1 restores its image and keeps the added package out', async ({ page }) => {
  const before = await env();

  await page.goto(editUrl);
  await page.getByRole('button', { name: 'History (2)' }).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog.getByText('Version 2')).toBeVisible();
  await expect(dialog.getByText(`+ ${ADDED}`)).toBeVisible();
  await dialog.getByRole('button', { name: 'Rollback to this version' }).click();

  await expect(page.getByText('Removed by you. These stay out of the image until you restore them.')).toBeVisible({
    timeout: 120_000,
  });
  await expect(page.getByText('Packages (1)', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Restore' })).toBeVisible();

  const after = await env();
  expect(after.requirements).toBe(DETECTED);
  expect(after.excludedPackages).toEqual([ADDED]);
  expect(after.imageName).toBe(before.imageHistory[0].image_name);
  expect(after.imageOutOfDate).toBe(false);
  expect(after.currentBuildVersion).toBe(1);
});
