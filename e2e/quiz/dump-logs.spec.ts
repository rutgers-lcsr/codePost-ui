// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
//
// B44: testResults returns the dumpMode `_tests.txt` log as `logs`. The seeded submission carries a
// `_tests.txt` SubmissionFile exactly as autograder/run.py:_runAndDump writes it (hidden before
// publish). NOT covered here: producing that file from a real dumpMode run, which needs the
// autograder's Docker sandbox (owned by the autograder area).
import { test, expect, type APIRequestContext } from '@playwright/test';
import { apiAs, loginAs, seed, type Seed } from './helpers';

let s: Seed;
let admin: APIRequestContext;
let student: APIRequestContext;

test.beforeAll(async () => {
  s = seed('dump', 'EQZ-dump ', 's1');
  admin = await apiAs(await loginAs('course_admin'));
  student = await apiAs(s.tokens.s1);
});

test.afterAll(async () => {
  await admin.dispose();
  await student.dispose();
});

test('staff get the dump log through testResults', async () => {
  const resp = await admin.get(`/submissions/${s.sub}/testResults/`);
  expect(resp.status()).toBe(200);
  expect((await resp.json()).logs).toBe('E2E-DUMP-LOG-LINE');
});

test('the student gets the log only once their results are revealed', async () => {
  const logs = async () => (await (await student.get(`/submissions/${s.sub}/testResults/`)).json()).logs ?? '';

  // Feedback not released: no dump, which holds every test's output including hidden ones.
  expect(await logs()).toBe('');

  const assignment = (await (await admin.get(`/submissions/${s.sub}/`)).json()).assignment;
  const released = await admin.patch(`/assignments/${assignment}/`, { data: { feedbackStatus: 'released' } });
  expect(released.ok(), `${released.status()} ${(await released.text()).slice(0, 300)}`).toBeTruthy();
  expect(await logs(), 'released but the submission is not finalized yet').toBe('');

  // Finalizing an unclaimed submission is a readable 400, not a 500 (KeyError on the missing grader).
  const ungraded = await admin.patch(`/submissions/${s.sub}/`, { data: { isFinalized: true } });
  expect(ungraded.status()).toBe(400);
  expect(JSON.stringify(await ungraded.json())).toMatch(/must have a grader/);

  const finalized = await admin.patch(`/submissions/${s.sub}/`, { data: { grader: s.graderEmail, isFinalized: true } });
  expect(finalized.ok(), `${finalized.status()} ${(await finalized.text()).slice(0, 300)}`).toBeTruthy();
  expect(await logs()).toBe('E2E-DUMP-LOG-LINE');
});
