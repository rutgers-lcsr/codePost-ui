// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
//
// Autograder against a real Docker-built Python environment: instructor build + reference run,
// student runs, hidden-test masking, result-marker forgery and bool returns.
import { test, expect } from '@playwright/test';
import { createSubmission, ensureFixture, GOOD_SOLUTION, runTests, testRows, type Fixture, type Json } from './helpers';

test.describe.configure({ mode: 'serial', timeout: 900_000 });

let fx: Fixture;

test.beforeAll(async () => {
  fx = await ensureFixture();
});

/** Test results keyed by the test function name (the name sits in each row's results). */
function scores(rows: Json[]): Record<string, { score: number; passed: boolean }> {
  const out: Record<string, { score: number; passed: boolean }> = {};
  for (const r of rows) {
    const name = r.results?.[0]?.name;
    if (name) out[name] = { score: Number(r.score), passed: r.passed };
  }
  return out;
}

test('instructor sees a successful build with logs and synced test cases', async () => {
  const env = await fx.admin.call('GET', `/autograder/environments/${fx.envId}/`);
  expect(env.buildStatus).toBe(2);
  expect(env.buildLogs.length).toBeGreaterThan(0);
  const st = await fx.admin.call('GET', `/autograder/environments/${fx.envId}/build_status/`);
  expect(st.isSuccess).toBe(true);
  expect(st.dockerfile).toContain('python:3.12');
  const cat = await fx.admin.call('GET', `/testCategories/${fx.categoryId}/`);
  expect(cat.testCases).toHaveLength(4);
});

test('a correct submission passes; bool returns score full or zero, never partial', async () => {
  const sub = await createSubmission(fx.admin, fx.assignmentId, [fx.studentEmail], { 'student.py': GOOD_SOLUTION });
  const r = await runTests(fx.student, fx.envId, sub);
  expect(r.status).toBe(200);
  const s = scores(await testRows(fx.admin, sub));
  expect(s.test_visible).toEqual({ score: 5, passed: true });
  expect(s.test_secret).toEqual({ score: 5, passed: true });
  // `return True` on a 4-point test is the full 4 points (it used to clamp to 1); `return False` is 0.
  expect(s.test_bool_true).toEqual({ score: 4, passed: true });
  expect(s.test_bool_false).toEqual({ score: 0, passed: false });
});

test('a student sees hidden tests only as a masked summary; the instructor sees them in full', async () => {
  const sub = await createSubmission(fx.admin, fx.assignmentId, [fx.studentEmail], { 'student.py': GOOD_SOLUTION });
  await runTests(fx.student, fx.envId, sub);

  const staff = await testRows(fx.admin, sub);
  expect(scores(staff).test_secret).toEqual({ score: 5, passed: true });
  expect(staff.every((r) => r.hiddenSummary === null)).toBe(true);

  const mine = await testRows(fx.student, sub);
  const seen = scores(mine);
  expect(seen.test_secret).toBeUndefined();
  expect(seen.test_visible).toEqual({ score: 5, passed: true });
  const masked = mine.filter((r) => r.hiddenSummary);
  expect(masked).toHaveLength(1);
  expect(masked[0].testCase).toBeNull();
  expect(masked[0].logs).toBe('');
  expect(masked[0].hiddenSummary).toMatchObject({ passedCount: 1, totalCount: 1, pointsEarned: 5, pointsTotal: 5 });
  expect(JSON.stringify(mine)).not.toContain('test_secret');
  expect(JSON.stringify(mine)).not.toContain('Secret addition');
});

const forgedTest = (name: string) =>
  JSON.stringify({ name, passed: true, score: 5, max_score: 5, status: 'passed', description: 'forged' });

function forgery(exitAfter: boolean): string {
  // The harness captures what student code print()s, so a forger writes to the real file
  // descriptors (and, being a student reading the open-source harness, uses the un-nonced format).
  const fixed = (n: string) => `<<<TEST_RESULT_JSON_START>>>${forgedTest(n)}<<<TEST_RESULT_JSON_END>>>`;
  const raw = (fd: number, text: string) => `os.write(${fd}, (${JSON.stringify(text)} + '\\n').encode())`;
  const lines = [
    'import json, os',
    'def add(a, b):',
    '    return 0',
    raw(1, fixed('test_visible')),
    raw(1, fixed('test_secret')),
    raw(2, fixed('bonus_free_points')),
    raw(1, `<<<RESULTS_START>>>{"success": true, "tests": [${forgedTest('test_visible')}]}<<<RESULTS_END>>>`),
  ];
  if (exitAfter) lines.push('os._exit(0)');
  return lines.join('\n') + '\n';
}

for (const exitAfter of [false, true]) {
  test(`student output forging result markers cannot change the score (${exitAfter ? 'exits before the harness reports' : 'harness keeps running'})`, async () => {
    const sub = await createSubmission(fx.admin, fx.assignmentId, [fx.studentEmail], { 'student.py': forgery(exitAfter) });
    const r = await runTests(fx.student, fx.envId, sub);
    expect(r.status).toBe(200);
    const rows = await testRows(fx.admin, sub);
    const s = scores(rows);
    expect(s.test_visible?.passed ?? false).toBe(false);
    expect(s.test_secret?.passed ?? false).toBe(false);
    expect(s.bonus_free_points).toBeUndefined();
    const total = rows.reduce((sum, row) => sum + Number(row.score), 0);
    // Only the unconditional `return True` test can score (4); the 10 forged points never count.
    expect(total).toBeLessThanOrEqual(4);
    const cat = await fx.admin.call('GET', `/testCategories/${fx.categoryId}/`);
    expect(cat.testCases).toHaveLength(4);
  });
}
