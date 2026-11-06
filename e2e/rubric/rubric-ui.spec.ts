// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
//
// The grader Rubrics page and the course setting that unlocks it, driven through the real UI.
import { test, expect, type Page } from '@playwright/test';
import {
  adminBase,
  graderBase,
  graderRubricUrl,
  recordApiRequests,
  seedRubricData,
  setGraderRubricEditing,
  signIn,
  enc,
  type SeedInfo,
} from './helpers';

test.use({ storageState: { cookies: [], origins: [] }, viewport: { width: 1500, height: 1000 } });
test.describe.configure({ mode: 'serial' });

let seed: SeedInfo;
test.beforeAll(() => {
  seed = seedRubricData();
});
test.afterAll(async () => setGraderRubricEditing(seed.courseId, true));

const rubricsLink = (page: Page) => page.getByLabel('Course navigation').getByRole('link', { name: 'Rubrics', exact: true });
const cards = (page: Page) => page.getByPlaceholder('Enter comment text...');
const lockIcons = (page: Page) => page.getByRole('img', { name: 'Already used in grading' });

async function openRubric(page: Page, url: string) {
  await page.goto(url);
  await expect(page.getByText('Categories', { exact: true })).toBeVisible({ timeout: 30_000 });
  await expect(cards(page).first()).toBeVisible();
}

async function openGraderHome(page: Page) {
  await page.goto(`${graderBase}/my_submissions/${enc('RB Flow')}`);
  await expect(page.getByLabel('Course navigation').getByRole('link', { name: 'Claimed by Me' })).toBeVisible({ timeout: 30_000 });
}

test('course admin switches "Allow Graders to Edit Rubric" on and off and it persists across reloads', async ({ page, context }) => {
  await setGraderRubricEditing(seed.courseId, false);
  await signIn(context, 'course_admin');
  await page.goto(`${adminBase}/settings`);
  const toggle = () => page.getByRole('switch', { name: 'Allow Graders to Edit Rubric' });
  await expect(toggle()).toBeVisible({ timeout: 30_000 });
  await expect(toggle()).not.toBeChecked();

  for (const on of [true, false]) {
    const saved = page.waitForResponse((r) => ['PUT', 'PATCH'].includes(r.request().method()) && /\/courses\/\d+\/$/.test(r.url()));
    await toggle().click();
    expect((await saved).ok(), `turning ${on ? 'on' : 'off'}`).toBeTruthy();
    await page.reload();
    await expect(toggle()).toBeVisible({ timeout: 30_000 });
    if (on) await expect(toggle()).toBeChecked();
    else await expect(toggle()).not.toBeChecked();
  }
});

test('setting OFF: the grader has no Rubrics nav entry, no "Open rubric" in the console menu, and the page is refused', async ({ page, context }) => {
  await setGraderRubricEditing(seed.courseId, false);
  await signIn(context, 'grader_basic');
  await openGraderHome(page);
  await expect(rubricsLink(page)).toHaveCount(0);

  await page.goto(graderRubricUrl('RB Standard'));
  await expect(page.getByText("You don't have access to this page in this course.")).toBeVisible({ timeout: 30_000 });
  await expect(cards(page)).toHaveCount(0);

  await page.goto(`/code/${seed.standardSub}`);
  await expect(page.locator('#line-0')).toBeVisible({ timeout: 60_000 });
  await page.getByRole('img', { name: 'menu' }).first().click();
  await expect(page.getByText('Code Review Console')).toBeVisible();
  await expect(page.getByText('Open rubric')).toHaveCount(0);
});

test('setting ON: a grader reaches the rubric from the nav and the console menu', async ({ page, context }) => {
  await setGraderRubricEditing(seed.courseId, true);
  await signIn(context, 'grader_basic');
  await openGraderHome(page);
  await expect(rubricsLink(page)).toBeVisible();

  await page.goto(`/code/${seed.standardSub}`);
  await expect(page.locator('#line-0')).toBeVisible({ timeout: 60_000 });
  await page.getByRole('img', { name: 'menu' }).first().click();
  const open = page.getByRole('link', { name: /Open rubric/ });
  await expect(open).toBeVisible();
  await open.click();
  await expect(page).toHaveURL(new RegExp(`/grader/.*/rubrics/${enc('RB Standard')}`));
  await expect(cards(page).first()).toBeVisible({ timeout: 30_000 });
});

test('setting ON: a grader adds and edits comments; applied ones are locked; no delete or category write is ever sent', async ({ page, context }) => {
  await setGraderRubricEditing(seed.courseId, true);
  await signIn(context, 'grader_basic');
  const requests = recordApiRequests(page);
  await openRubric(page, graderRubricUrl('RB Standard'));

  // The applied comment: locked, read-only, explanation and instructions open view-only.
  const applied = cards(page).nth(0);
  await expect(applied).toHaveValue('RB applied criterion');
  await expect(applied).toBeDisabled();
  await expect(lockIcons(page)).toHaveCount(1);
  await page.getByRole('button', { name: 'View Explanation' }).click();
  await expect(page.getByRole('dialog').getByRole('textbox')).toHaveValue('RB applied explanation');
  await expect(page.getByRole('dialog').getByRole('textbox')).toHaveAttribute('readonly', '');
  await expect(page.getByRole('dialog').getByRole('button', { name: 'Save' })).toHaveCount(0);
  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: 'View Instructions' }).click();
  await expect(page.getByRole('dialog').getByRole('textbox')).toHaveValue('RB applied instructions');
  await expect(page.getByRole('dialog').getByRole('textbox')).toHaveAttribute('readonly', '');
  await page.keyboard.press('Escape');

  // No delete or category controls anywhere.
  await expect(page.getByRole('button', { name: 'Delete criterion' })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Delete category' })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Add new category' })).toHaveCount(0);
  await expect(page.getByPlaceholder('Category Name')).toBeDisabled();

  // The unapplied comment is editable and the edit persists.
  const unapplied = cards(page).nth(1);
  await expect(unapplied).toHaveValue('RB unapplied criterion');
  await expect(unapplied).toBeEnabled();
  const isWrite = (verbs: string[]) => (r: { request(): { method(): string }; url(): string }) =>
    verbs.includes(r.request().method()) && /\/rubricComments\//.test(r.url());
  await unapplied.fill('RB unapplied criterion (grader edit)');
  await unapplied.blur();

  // A new criterion can be added; both changes go out with the page's Save.
  await page.getByRole('button', { name: 'Add Criteria' }).click();
  const fresh = cards(page).last();
  await fresh.fill('RB grader-added criterion');
  await fresh.blur();
  const edited = page.waitForResponse(isWrite(['PUT', 'PATCH']));
  const created = page.waitForResponse(isWrite(['POST']));
  await page.getByRole('button', { name: /Save$/ }).click();
  expect((await edited).ok()).toBeTruthy();
  expect((await created).status()).toBe(201);

  await page.reload();
  await expect(cards(page).first()).toBeVisible({ timeout: 30_000 });
  await expect(cards(page)).toHaveCount(3);
  await expect(cards(page).nth(1)).toHaveValue('RB unapplied criterion (grader edit)');
  await expect(cards(page).nth(1)).toBeEnabled();
  await expect(cards(page).nth(2)).toHaveValue('RB grader-added criterion');
  await expect(cards(page).nth(2)).toBeEnabled();
  await expect(lockIcons(page)).toHaveCount(1);

  const writes = requests.filter((r) => r.method !== 'GET' && r.method !== 'OPTIONS');
  expect(writes.filter((r) => r.method === 'DELETE'), 'no DELETE sent').toEqual([]);
  expect(writes.filter((r) => /\/rubricCategories\//.test(r.url)), 'no category write sent').toEqual([]);
  expect(writes.some((r) => /\/rubricComments\//.test(r.url))).toBeTruthy();
});

for (const role of ['grader_rubric', 'course_admin'] as const) {
  test(`${role} keeps the full rubric controls (delete criterion, category controls, no lock)`, async ({ page, context }) => {
    await setGraderRubricEditing(seed.courseId, true);
    await signIn(context, role);
    await openRubric(page, role === 'course_admin' ? `${adminBase}/assignments/rubrics/${enc('RB Standard')}` : graderRubricUrl('RB Standard'));
    const total = await cards(page).count();
  expect(total).toBeGreaterThanOrEqual(2);
  await expect(page.getByRole('button', { name: 'Delete criterion' })).toHaveCount(total);
    await expect(page.getByRole('button', { name: 'Add new category' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Delete category' })).toHaveCount(1);
    await expect(lockIcons(page)).toHaveCount(0);
    await expect(cards(page).nth(0)).toBeEnabled();
    await expect(page.getByRole('button', { name: 'Edit Explanation' })).toBeVisible();
  });
}

test('collaborative-rubric assignment: a grader gets the full controls', async ({ page, context }) => {
  await setGraderRubricEditing(seed.courseId, true);
  await signIn(context, 'grader_basic');
  await openRubric(page, graderRubricUrl('RB Collab'));
  const total = await cards(page).count();
  expect(total).toBeGreaterThanOrEqual(2);
  await expect(page.getByRole('button', { name: 'Delete criterion' })).toHaveCount(total);
  await expect(page.getByRole('button', { name: 'Add new category' })).toBeVisible();
  await expect(lockIcons(page)).toHaveCount(0);
  await expect(cards(page).nth(0)).toBeEnabled();
});
