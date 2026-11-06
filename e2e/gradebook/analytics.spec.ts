// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
//
// Gradebook, analytics, class statistics and late days (hardening round 2, F7).
// Seed (seed_gradebook.py), GB Grades:
//   Lab 1  finalized grades 2,4,6,10 + one finalized NULL grade; s6 has a dated and a NULL-dated
//          submission, s7 two and s8 three attempts      -> mean 5.5, median 5 (even count)
//   Lab 2  late uploads; s2 resubmits three times (30h, 100h, finalized 49h), s4 is exactly 24h late
//   Lab 3  finalized grades -5, 10, 20
import { expect, test } from '@playwright/test';
import { API_URL } from '../constants';
import { adminCourseUrl, auth, manage, seedGradebook, signIn, type Seed } from './helpers';

test.describe.configure({ mode: 'serial' });

let seed: Seed;
test.beforeAll(() => {
  seed = seedGradebook();
});

const analytics = async (request: import('@playwright/test').APIRequestContext, assignment: number) => {
  const resp = await request.get(`${API_URL}/assignments/${assignment}/analytics/`, {
    headers: auth(seed.tokens.course_admin),
  });
  expect(resp.status(), await resp.text()).toBe(200);
  return resp.json();
};

test('analytics loads for an assignment with a null-grade finalized submission and a null-dated submission', async ({
  request,
}) => {
  const body = await analytics(request, seed.assignments.lab1);
  expect(body.gradeDistribution).toHaveLength(10);
  expect(body.graderConsistency[0].count).toBe(4); // the NULL-grade row is not graded work
});

test('studentsWithMultipleAttempts counts students, not distinct attempt counts', async ({ request }) => {
  const { submissionAttempts } = await analytics(request, seed.assignments.lab1);
  // s6 and s7 have 2 attempts, s8 has 3: three students. (The old code counted the keys {2, 3} -> 2.)
  expect(submissionAttempts.studentsWithMultipleAttempts).toBe(3);
  expect(submissionAttempts.attemptDistribution).toEqual(
    expect.arrayContaining([
      { attempts: 2, studentCount: 2 },
      { attempts: 3, studentCount: 1 },
    ]),
  );
});

test('a negative grade is counted in the grade distribution', async ({ request }) => {
  const { gradeDistribution } = await analytics(request, seed.assignments.lab3);
  const counts = gradeDistribution.map((b: { count: number }) => b.count);
  expect(counts.reduce((a: number, b: number) => a + b, 0)).toBe(3);
  expect(counts[0]).toBe(1); // -5 lands in the lowest bucket
});

test('class mean and median are live and the median of an even count averages the middle two', async ({
  request,
}) => {
  const staff = await request.get(`${API_URL}/assignments/${seed.assignments.lab1}/`, {
    headers: auth(seed.tokens.course_admin),
  });
  const body = await staff.json();
  expect(Number(body.mean)).toBe(5.5);
  expect(Number(body.median)).toBe(5); // grades 2,4,6,10: not the upper-middle 6

  // Students see the same numbers once statistics are shown and feedback is released.
  const student = await request.get(`${API_URL}/assignments/${seed.assignments.lab1}/`, {
    headers: auth(seed.tokens.student_s1),
  });
  const studentBody = await student.json();
  expect(Number(studentBody.mean)).toBe(5.5);
  expect(Number(studentBody.median)).toBe(5);
});

test('analytics late days follow the one rule: floor+1 with a 2h grace, exactly 24h late is day 2', async ({
  request,
}) => {
  const { lateSubmissions } = await analytics(request, seed.assignments.lab2);
  expect(lateSubmissions.onTime).toBe(1); // 1h late is inside the grace period
  expect(lateSubmissions.late).toBe(5);
  expect(lateSubmissions.lateByDay).toEqual([
    { day: 2, count: 3 }, // 30h, 30h and exactly 24h
    { day: 3, count: 1 }, // 49h
    { day: 5, count: 1 }, // 100h
  ]);
});

test('export_late_days charges the best submission once per student and assignment, same rule as analytics', () => {
  const csv = manage(['export_late_days', '--course-id', String(seed.courses.grades)]);
  const days: Record<string, number> = {};
  for (const line of csv.split('\n')) {
    const m = line.trim().match(/^(gb_s\d@dev\.edu),(\d+)$/);
    if (m) days[m[1]] = Number(m[2]);
  }
  expect(days['gb_s1@dev.edu']).toBe(2);
  // s2 uploaded 2, 5 and 3 days late; the finalized one (3) is the one that counts, not the sum 10.
  expect(days['gb_s2@dev.edu']).toBe(3);
  expect(days['gb_s3@dev.edu']).toBe(0);
  expect(days['gb_s4@dev.edu']).toBe(2); // exactly 24h late: 2, agrees with the analytics panel
});

test('gradebook API ranks the best submission per cell and keeps a NULL grade out of the totals', async ({
  request,
}) => {
  const resp = await request.get(`${API_URL}/courses/${seed.courses.grades}/gradebook/`, {
    headers: auth(seed.tokens.course_admin),
  });
  expect(resp.status()).toBe(200);
  const body = await resp.json();
  const row = (email: string) => body.rows.find((r: { student: string }) => r.student === email);
  const s5 = row('gb_s5@dev.edu');
  expect(Number(s5.totalEarned)).toBe(0);
  expect(s5.percent).toBeNull();
  const s2 = row('gb_s2@dev.edu');
  // Lab 1: 4/10, Lab 2: 8/10 (finalized resubmission), Lab 3: 10/20
  expect(Number(s2.totalEarned)).toBe(22);
  expect(Number(s2.totalPossible)).toBe(40);
});

test('admin gradebook page shows the per-assignment averages of the grades', async ({ page }) => {
  await signIn(page, seed.tokens.course_admin);
  await page.goto(adminCourseUrl('GB Grades', '/gradebook'));
  await expect(page.getByText('gb_s1@dev.edu')).toBeVisible({ timeout: 60_000 });
  const average = page.locator('tr', { has: page.getByText(/^Average/) });
  await expect(average).toContainText('5.5'); // Lab 1: (2+4+6+10)/4, the NULL grade is not a zero
  await expect(average).toContainText('8.3'); // Lab 3: (-5+10+20)/3
});

test('the admin assignments page and bulk listing load a course with many assignments', async ({ page, request }) => {
  const count = 40;
  const ids = JSON.parse(
    manage(
      ['shell'],
      `
import json
from core.models import Assignment, Course
c = Course.objects.get(pk=${seed.courses.target})
for i in range(${count}):
    Assignment.objects.get_or_create(course=c, name='Bulk %02d' % i, defaults=dict(points=10, state='published'))
print('IDS ' + json.dumps(list(c.assignments.values_list('id', flat=True))))
`,
    )
      .split('\n')
      .find((l) => l.startsWith('IDS '))!
      .slice(4),
  ) as number[];
  expect(ids.length).toBeGreaterThanOrEqual(count);

  const resp = await request.get(`${API_URL}/courses/${seed.courses.target}/assignments/`, {
    headers: auth(seed.tokens.course_admin),
  });
  expect(resp.status()).toBe(200);
  expect((await resp.json()).length).toBe(ids.length);

  await signIn(page, seed.tokens.course_admin);
  await page.goto(adminCourseUrl('GB Target', '/assignments'));
  await expect(page.getByText('Bulk 00').first()).toBeVisible({ timeout: 60_000 });
});
