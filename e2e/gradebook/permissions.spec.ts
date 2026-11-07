// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
//
// Permissions and serializers (hardening round 2, F8 + F9): who may read an autograder task, org
// staff of the course's own organization vs another one, roster PATCH for superusers and org
// staff, and the serializer validation/audit fixes.
import { expect, test } from '@playwright/test';
import { API_URL } from '../constants';
import { adminCourseUrl, auditEvents, auth, seedGradebook, shellJson, signIn, type Seed } from './helpers';

test.describe.configure({ mode: 'serial' });

let seed: Seed;
test.beforeAll(() => {
  seed = seedGradebook();
});

test.describe('GET /autograder/tasks/<id>/', () => {
  const TASK = 'gb-e2e-task-0001';

  test.beforeAll(() => {
    // Exactly what Celery's extended django-db backend stores for run_test_task(submission_id, user_id=...).
    shellJson<{ ok: boolean }>(`
import json
from django.contrib.auth.models import User
from django_celery_results.models import TaskResult
from core.models import Submission
sub = Submission.objects.filter(assignment_id=${seed.assignments.lab1}, students__email='gb_s1@dev.edu').first()
admin = User.objects.get(username='course_admin_only')
TaskResult.objects.filter(task_id='${TASK}').delete()
TaskResult.objects.create(task_id='${TASK}', task_name='autograder.tasks.run_test_task', status='SUCCESS',
    task_args=json.dumps('(' + str(sub.id) + ',)'), task_kwargs=json.dumps("{'user_id': " + str(admin.id) + "}"),
    result=json.dumps({'output': 'secret test output'}))
print('RESULT ' + json.dumps({'ok': True}))
`);
  });

  test('the dispatcher, course staff and superusers read the result', async ({ request }) => {
    for (const token of [seed.tokens.course_admin, seed.tokens.superuser]) {
      const resp = await request.get(`${API_URL}/autograder/tasks/${TASK}/`, { headers: auth(token) });
      expect(resp.status(), await resp.text()).toBe(200);
      expect((await resp.json()).status).toBe('SUCCESS');
    }
    // A grader of the course is course staff.
    const grader = await request.post(`${API_URL}/dev-auth/login-as/`, { data: { role: 'grader_basic' } });
    // grader_basic is staff of the Demo Course, not of GB Grades: only members of GB Grades qualify.
    expect(grader.ok()).toBeTruthy();
    const orgOwn = await request.get(`${API_URL}/autograder/tasks/${TASK}/`, {
      headers: auth(seed.tokens[seed.emails.orgOwn]),
    });
    expect(orgOwn.status(), 'org staff who is also a grader of the course').toBe(200);
  });

  test("another course's admin and a student are refused", async ({ request }) => {
    for (const token of [seed.tokens[seed.emails.otherAdmin], seed.tokens.student_s1]) {
      const resp = await request.get(`${API_URL}/autograder/tasks/${TASK}/`, { headers: auth(token) });
      expect(resp.status()).toBe(403);
      expect(typeof (await resp.json()).detail).toBe('string');
    }
  });
});

test.describe('edit_course_settings is limited to the course organization', () => {
  test('org staff of another organization has the capability off, PATCH is 403 and the UI has no settings', async ({
    page,
    request,
  }) => {
    const token = seed.tokens[seed.emails.orgForeign];
    const caps = await request.get(`${API_URL}/courses/${seed.courses.grades}/capabilities/`, { headers: auth(token) });
    expect(caps.status(), await caps.text()).toBe(200);
    expect((await caps.json()).capabilitiesMap.edit_course_settings).toBe(false);

    const patch = await request.patch(`${API_URL}/courses/${seed.courses.grades}/courseSettings/`, {
      headers: auth(token),
      data: { showStudentsStatistics: false },
    });
    expect(patch.status()).toBe(403);

    await signIn(page, token);
    await page.goto(adminCourseUrl('GB Grades', '/settings'));
    await page.waitForLoadState('networkidle');
    await expect(page.getByRole('switch', { name: /archive course/i })).toHaveCount(0);
  });

  test('org staff of the course organization still can', async ({ request }) => {
    const token = seed.tokens[seed.emails.orgOwn];
    const caps = await request.get(`${API_URL}/courses/${seed.courses.grades}/capabilities/`, { headers: auth(token) });
    expect((await caps.json()).capabilitiesMap.edit_course_settings).toBe(true);
    const patch = await request.patch(`${API_URL}/courses/${seed.courses.grades}/courseSettings/`, {
      headers: auth(token),
      data: { showStudentsStatistics: true },
    });
    expect(patch.status(), await patch.text()).toBe(200);
  });
});

test.describe('roster PATCH', () => {
  for (const [who, key] of [
    ['a superuser who is not a course admin', 'superuser'],
    ['org staff of the course organization', 'orgOwn'],
  ] as const) {
    // Neither is a course admin; org staff (a plain grader here, seeded with canModifyRosters
    // off, which being org staff forces back on) read and edit the roster with their own token.
    test(`${who} can add a student`, async ({ request }) => {
      const token = key === 'superuser' ? seed.tokens.superuser : seed.tokens[seed.emails.orgOwn];
      const roster = await request.get(`${API_URL}/courses/${seed.courses.grades}/roster/`, {
        headers: auth(token),
      });
      expect(roster.status(), await roster.text()).toBe(200);
      const students: string[] = (await roster.json()).students;
      const newStudent = key === 'superuser' ? seed.emails.newStudent : 'gb_new_student2@dev.edu';
      const resp = await request.patch(`${API_URL}/courses/${seed.courses.grades}/roster/`, {
        headers: auth(token),
        data: { students: [...students, newStudent] },
      });
      expect(resp.status(), await resp.text()).toBe(200);
      expect((await resp.json()).students).toContain(newStudent);
    });
  }

  test('org staff see the roster from the organization console', async ({ page }) => {
    await signIn(page, seed.tokens[seed.emails.orgOwn]);
    await page.goto('/organization/courses');
    await page
      .getByRole('row', { name: /GB Grades/ })
      .getByRole('button', { name: 'Roster' })
      .click();

    const drawer = page.getByRole('dialog').filter({ hasText: 'Roster — GB Grades' });
    await expect(drawer.getByText(seed.emails.s1, { exact: true })).toBeVisible();
    await drawer.getByRole('tab', { name: /^Graders/ }).click();
    await expect(drawer.getByText(seed.emails.grader, { exact: true })).toBeVisible();
    await drawer.getByRole('tab', { name: /^Course Admins/ }).click();
    await expect(drawer.getByText(seed.emails.admin, { exact: true })).toBeVisible();
  });

  test('org staff of another organization cannot read or edit the roster', async ({ request }) => {
    const token = seed.tokens[seed.emails.orgForeign];
    const url = `${API_URL}/courses/${seed.courses.grades}/roster/`;
    expect((await request.get(url, { headers: auth(token) })).status()).toBe(403);
    const resp = await request.patch(url, { headers: auth(token), data: { students: [] } });
    expect(resp.status()).toBe(403);
    const after = await request.get(url, { headers: auth(seed.tokens.course_admin) });
    expect((await after.json()).students.length).toBeGreaterThan(0);
  });
});

test.describe('serializers', () => {
  test('a malformed course with hideFrom is a 400, not a 500', async ({ request }) => {
    for (const course of ['abc', ['x'], { a: 1 }]) {
      const resp = await request.post(`${API_URL}/assignments/`, {
        headers: auth(seed.tokens.course_admin),
        data: { name: 'Bad', course, hideFrom: [1] },
      });
      expect(resp.status(), JSON.stringify(course)).toBe(400);
      // A field error on `course` (or a detail): a readable body either way, never a 500 page.
      const body = await resp.json();
      expect(Object.keys(body).length, JSON.stringify(course)).toBeGreaterThan(0);
    }
  });

  test('an unknown placeholder in an assignment prompt is a 400 naming it', async ({ request }) => {
    const resp = await request.patch(`${API_URL}/assignments/${seed.assignments.lab1}/`, {
      headers: auth(seed.tokens.course_admin),
      data: { ai_summary_prompt: 'Summarise {definitely_not_a_placeholder}' },
    });
    expect(resp.status()).toBe(400);
    expect(JSON.stringify(await resp.json())).toContain('definitely_not_a_placeholder');
  });

  test('late-day credits write one late_day_used event per change and none for unrelated PATCHes', async ({
    request,
  }) => {
    const headers = auth(seed.tokens.course_admin);
    const id = seed.submissions.lateSub;
    const count = async () =>
      (await auditEvents(request, seed.tokens.course_admin, seed.courses.grades, 'late_day_used')).length;
    const before = await count();

    const unrelated = await request.patch(`${API_URL}/submissions/${id}/`, { headers, data: { queueOrderKey: 7 } });
    expect(unrelated.status(), await unrelated.text()).toBe(200);
    expect(await count()).toBe(before);

    const first = await request.patch(`${API_URL}/submissions/${id}/`, { headers, data: { lateDayCreditsUsed: 2 } });
    expect(first.status(), await first.text()).toBe(200);
    expect(await count()).toBe(before + 1);

    const same = await request.patch(`${API_URL}/submissions/${id}/`, { headers, data: { lateDayCreditsUsed: 2 } });
    expect(same.status()).toBe(200);
    expect(await count()).toBe(before + 1);

    // Lowering the allowance afterwards must not block an unrelated PATCH.
    await request.patch(`${API_URL}/courses/${seed.courses.grades}/courseSettings/`, {
      headers,
      data: { lateDayCreditsAllowable: 1 },
    });
    const later = await request.patch(`${API_URL}/submissions/${id}/`, { headers, data: { queueOrderKey: 8 } });
    expect(later.status(), await later.text()).toBe(200);
  });
});
