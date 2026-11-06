// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
//
// Archived courses are read-only (hardening round 1, C-archived-access): creates and deletes are
// refused like edits are, with a `detail`, and cloning an assignment OUT of an archived course
// still works.
import { expect, test } from '@playwright/test';
import { API_URL } from '../constants';
import { adminCourseUrl, auth, seedGradebook, signIn, type Seed } from './helpers';

test.describe.configure({ mode: 'serial' });

let seed: Seed;
test.beforeAll(() => {
  seed = seedGradebook();
});

const REFUSED = [400, 403, 409];

test('creating rubric categories and rubric comments in an archived course is refused with a detail', async ({
  request,
}) => {
  const headers = auth(seed.tokens.course_admin);
  const category = await request.post(`${API_URL}/rubricCategories/`, {
    headers,
    data: { name: 'New category', assignment: seed.assignments.archived, sortKey: 5 },
  });
  expect(REFUSED, await category.text()).toContain(category.status());
  expect(typeof (await category.json()).detail).toBe('string');

  const comment = await request.post(`${API_URL}/rubricComments/`, {
    headers,
    data: { name: 'New', text: 'New', pointDelta: 1, category: seed.rubric.category, sortKey: 5 },
  });
  expect(REFUSED, await comment.text()).toContain(comment.status());
  expect(typeof (await comment.json()).detail).toBe('string');
});

test('deleting a rubric comment or a submission of an archived course is refused', async ({ request }) => {
  const headers = auth(seed.tokens.course_admin);
  const rubric = await request.delete(`${API_URL}/rubricComments/${seed.rubric.comment}/`, { headers });
  expect(REFUSED, await rubric.text()).toContain(rubric.status());
  const submission = await request.delete(`${API_URL}/submissions/${seed.submissions.archived}/`, { headers });
  expect(REFUSED, await submission.text()).toContain(submission.status());
  // Nothing was deleted.
  const still = await request.get(`${API_URL}/submissions/${seed.submissions.archived}/`, { headers });
  expect(still.status()).toBe(200);
});

test('editing an archived assignment is a 400 with a detail', async ({ request }) => {
  const resp = await request.patch(`${API_URL}/assignments/${seed.assignments.archived}/`, {
    headers: auth(seed.tokens.course_admin),
    data: { name: 'Renamed' },
  });
  expect(resp.status()).toBe(400);
  expect(typeof (await resp.json()).detail).toBe('string');
});

test('an assignment can be cloned out of an archived course into an active one', async ({ request }) => {
  const headers = auth(seed.tokens.course_admin);
  const resp = await request.post(`${API_URL}/assignments/${seed.assignments.archived}/clone/`, {
    headers,
    data: { course: seed.courses.target },
  });
  expect(resp.status(), await resp.text()).toBe(200);
  const clone = await resp.json();
  expect(clone.course).toBe(seed.courses.target);
  expect(clone.name).toContain('Archived Lab');
});

test('archiving a course in Course Settings makes it read-only', async ({ page, request }) => {
  const headers = auth(seed.tokens.course_admin);
  await signIn(page, seed.tokens.course_admin);
  await page.goto(adminCourseUrl('GB UiArchive', '/settings'));
  const toggle = page.getByRole('switch', { name: /archive course/i });
  await expect(toggle).toBeVisible({ timeout: 60_000 });
  await toggle.click();
  await page.getByRole('button', { name: 'Archive', exact: true }).click();
  await expect(toggle).toBeChecked();

  await expect.poll(async () => {
    const course = await request.get(`${API_URL}/courses/${seed.courses.uiarchive}/`, { headers });
    return (await course.json()).archived;
  }).toBe(true);

  // The assignments page now flags the course as archived ...
  await page.goto(adminCourseUrl('GB UiArchive', '/assignments'));
  await expect(page.getByText('Archived', { exact: true }).first()).toBeVisible({ timeout: 30_000 });

  // ... and the API refuses writes into it.
  const list = await request.get(`${API_URL}/courses/${seed.courses.uiarchive}/assignments/`, { headers });
  const [assignment] = await list.json();
  const patch = await request.patch(`${API_URL}/assignments/${assignment.id}/`, { headers, data: { name: 'Nope' } });
  expect(patch.status()).toBe(400);
  expect(typeof (await patch.json()).detail).toBe('string');
});
