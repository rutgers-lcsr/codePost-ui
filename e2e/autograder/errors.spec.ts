// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
//
// Error text: the instructor keeps real pip/Docker diagnostics in build logs, while what a
// student can read after a failed run never carries Docker, registry or filesystem detail.
import { test, expect } from '@playwright/test';
import { execFileSync } from 'node:child_process';
import {
  Api, createSubmission, ensureAssignment, GOOD_SOLUTION, loginAs, runTests, testRows, waitForBuild,
} from './helpers';

test.describe.configure({ mode: 'serial', timeout: 600_000 });

let admin: Api;
let student: Api;
let studentEmail: string;

test.beforeAll(async () => {
  admin = new Api(await loginAs('course_admin'));
  student = new Api(await loginAs('student'));
  studentEmail = (await student.call('GET', '/users/me/')).email;
});

test('a failing pip install shows the instructor the real pip error in the build log', async () => {
  const { envId } = await ensureAssignment(admin, 'AG E2E Bad Pip');
  await admin.call('PATCH', `/autograder/environments/${envId}/build/`, {
    language: 'python-3.12', requirements: 'nonexistent-pkg-zzq-9==1.0', autoDetect: false,
  });
  const st = await waitForBuild(admin, envId);
  expect(st.isSuccess).toBe(false);
  expect(st.logs).toContain('No matching distribution found for nonexistent-pkg-zzq-9==1.0');
  expect(st.logs).toContain('Build failed');
  expect(st.logs).not.toContain('An internal error occurred');
  const env = await admin.call('GET', `/autograder/environments/${envId}/`);
  expect(env.buildStatus).toBe(3);
});

test('a run whose Docker image is gone shows the student no Docker, registry or path detail', async () => {
  const { assignmentId, envId } = await ensureAssignment(admin, 'AG E2E Broken Image');
  await admin.call('PATCH', `/autograder/environments/${envId}/build/`, {
    language: 'python-3.12', requirements: '', autoDetect: false,
  });
  expect((await waitForBuild(admin, envId)).isSuccess).toBe(true);
  let a = await admin.call('GET', `/assignments/${assignmentId}/`);
  if (!a.testCategories?.length) {
    await admin.call('POST', '/testCategories/', {
      name: 'Broken', assignment: assignmentId, maxPoints: 1,
      testScript: "@test(name='test_one', points=1)\ndef test_one():\n    pass\n",
    });
    a = await admin.call('GET', `/assignments/${assignmentId}/`);
  }
  const cat = await admin.call('GET', `/testCategories/${a.testCategories[0]}/`);
  for (const id of cat.testCases as number[]) await admin.call('PATCH', `/testCases/${id}/`, { exposed: true });

  const env = await admin.call('GET', `/autograder/environments/${envId}/`);
  execFileSync('docker', ['rmi', '-f', env.imageName]);
  const sub = await createSubmission(admin, assignmentId, [studentEmail], { 'student.py': GOOD_SOLUTION });
  const r = await runTests(student, envId, sub);
  expect(r.status).toBe(200);

  const rows = await testRows(student, sub);
  console.log('STUDENT_ROWS', JSON.stringify(rows));
  expect(rows.length).toBeGreaterThan(0);
  const text = JSON.stringify(rows);
  for (const leak of ['pull access denied', 'codepost-env', 'docker login', 'Traceback', '/staff/', '/tmp/', 'http+docker']) {
    expect(text, `student-visible rows leak "${leak}"`).not.toContain(leak);
  }
  for (const row of rows) expect(row.passed).toBe(false);
});
