// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
//
// The instructor's Environment & Tests page for a built Python environment: build status and
// logs, and the Environment Shell widget (xterm over the shell websocket) running a command.
import { test, expect } from '@playwright/test';
import { COURSE_NAME, COURSE_PERIOD } from '../constants';
import { ensureFixture, type Fixture } from './helpers';

test.use({ storageState: 'e2e/.auth/instructor.json' });
test.describe.configure({ timeout: 600_000 });

let fx: Fixture;

test.beforeAll(async () => {
  fx = await ensureFixture();
  // The shell widget needs assignment files to mount (inert here: auto-detect is off).
  const a = await fx.admin.call('GET', `/assignments/${fx.assignmentId}/`);
  if (!a.files?.length) {
    await fx.admin.call('POST', '/assignmentFiles/', {
      assignment: fx.assignmentId, name: 'notes.txt', data: 'hello\n', extension: '.txt', path: 'notes.txt',
    });
  }
});

const editUrl = () =>
  `/admin/${encodeURIComponent(COURSE_NAME)}/${encodeURIComponent(COURSE_PERIOD)}/assignments/environment/AG%20E2E%20Python/edit/environment`;

test('instructor sees the environment as Ready and can open its build logs', async ({ page }) => {
  await page.goto(editUrl());
  await expect(page.getByRole('heading', { name: 'Environment Configuration' })).toBeVisible({ timeout: 60_000 });
  await expect(page.getByText('Ready', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Build logs' }).click();
  await expect(page.getByRole('dialog').getByText(/Step \d+\/\d+|Successfully built|Starting build/).first()).toBeVisible();
});

test('instructor starts the Environment Shell and runs a command in the container', async ({ page }) => {
  await page.goto(editUrl());
  await expect(page.getByText('Environment Shell')).toBeVisible({ timeout: 60_000 });
  await page.getByRole('button', { name: 'Start' }).click();
  const term = page.getByRole('textbox', { name: 'Shell terminal' });
  await expect(term).toContainText('Shell session initialized', { timeout: 120_000 });
  await term.click();
  await page.keyboard.type('echo ok-$((20+22))\n');
  await expect(term).toContainText('ok-42', { timeout: 30_000 });
  await page.getByRole('button', { name: 'Stop' }).click();
  await expect(term).toContainText('Session stopped');
});
