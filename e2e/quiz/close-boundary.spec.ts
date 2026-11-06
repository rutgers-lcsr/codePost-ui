// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
//
// Quiz close boundary (round 1, B00/B01 + one close decision) and B02 (attempt deadlines follow a
// closeEvent='submission' close). Real HTTP against the real API. Each test starts a student's
// attempt while the close is a day away, then moves the close to a few seconds from now through the
// same admin edit a teacher would make, which re-derives the in-progress attempt's deadline.
import { test, expect, type APIRequestContext } from '@playwright/test';
import { apiAs, json, loginAs, seed, waitUntilPast, type Seed } from './helpers';

// Seconds from "the admin moved the close" to the close itself. Generous: the dev stack can be slow.
const CLOSE_IN_MS = 20_000;
// QuizAttemptViewSet.SAVE_DEADLINE_GRACE: autosaves in flight at the buzzer still land.
const SAVE_GRACE_MS = 5_000;

let s: Seed;
let admin: APIRequestContext;
const students: Record<string, APIRequestContext> = {};

test.beforeAll(async () => {
  s = seed('boundary', 'EQZ-boundary ', 's1,s2,s3,s4');
  admin = await apiAs(await loginAs('course_admin'));
  for (const slug of Object.keys(s.tokens)) students[slug] = await apiAs(s.tokens[slug]);
});

test.afterAll(async () => {
  await admin.dispose();
  for (const api of Object.values(students)) await api.dispose();
});

async function startAttempt(api: APIRequestContext, quiz: number) {
  const resp = await api.post('/quizAttempts/', { data: { quiz } });
  expect(resp.status(), JSON.stringify(await json(resp))).toBe(201);
  const attempt = await resp.json();
  return { id: attempt.id as number, responseId: attempt.responses[0].id as number };
}

const answer = (api: APIRequestContext, attempt: { id: number; responseId: number }, text: string) =>
  api.patch(`/quizAttempts/${attempt.id}/saveAnswer/`, { data: { response: attempt.responseId, answerText: text } });

/** The shared boundary assertions: answer before the close, refused after it, closed for new starts. */
async function expectBoundary(api: APIRequestContext, quiz: number, attempt: { id: number; responseId: number }, deadline: string) {
  expect((await answer(api, attempt, 'Paris')).status(), 'answer before the close').toBe(200);

  await waitUntilPast(deadline, SAVE_GRACE_MS + 1500);
  const late = await answer(api, attempt, 'late answer');
  expect(late.status(), 'answer after the close').toBe(400);
  expect((await late.json()).detail).toMatch(/time is up/i);

  // Starting again resumes the expired attempt and seals it; the answer typed after the close is not kept.
  const resumed = await (await api.post('/quizAttempts/', { data: { quiz } })).json();
  expect(resumed.status).toBe('submitted');
  const again = await api.post('/quizAttempts/', { data: { quiz } });
  expect(again.status()).toBe(403);
  expect((await again.json()).detail).toMatch(/not available \(closed\)/);
}

test('a standalone quiz stops taking answers at availableUntil', async () => {
  const attempt = await startAttempt(students.s1, s.standalone);
  const closeAt = new Date(Date.now() + CLOSE_IN_MS).toISOString();
  const patched = await admin.patch(`/quizzes/${s.standalone}/`, { data: { availableUntil: closeAt } });
  expect(patched.ok(), JSON.stringify(await json(patched))).toBeTruthy();

  const fresh = await (await students.s1.get(`/quizAttempts/${attempt.id}/`)).json();
  expect(new Date(fresh.deadline).getTime(), 'attempt deadline follows the new close').toBe(new Date(closeAt).getTime());
  await expectBoundary(students.s1, s.standalone, attempt, fresh.deadline);
});

test('a quiz closing at the assignment deadline uses the same boundary', async () => {
  const attempt = await startAttempt(students.s1, s.quizDue);
  const due = new Date(Date.now() + CLOSE_IN_MS).toISOString();
  const patched = await admin.patch(`/assignments/${s.assignmentDue}/`, { data: { uploadDueDate: due } });
  expect(patched.ok(), JSON.stringify(await json(patched))).toBeTruthy();

  const fresh = await (await students.s1.get(`/quizAttempts/${attempt.id}/`)).json();
  expect(new Date(fresh.deadline).getTime(), 'attempt deadline follows the due date').toBe(new Date(due).getTime());
  await expectBoundary(students.s1, s.quizDue, attempt, fresh.deadline);
});

test('a quiz closing at the student\'s submission uses the same boundary', async () => {
  const attempt = await startAttempt(students.s2, s.quizSub);
  // No submission yet, so there is no close to cap the attempt.
  expect((await (await students.s2.get(`/quizAttempts/${attempt.id}/`)).json()).deadline).toBeNull();

  const submittedAt = new Date(Date.now() + CLOSE_IN_MS).toISOString();
  const created = await admin.post('/submissions/', {
    data: { assignment: s.assignmentSub, students: [s.students.s2], dateUploaded: submittedAt },
  });
  expect(created.status(), JSON.stringify(await json(created))).toBe(201);

  const fresh = await (await students.s2.get(`/quizAttempts/${attempt.id}/`)).json();
  expect(new Date(fresh.deadline).getTime(), 'B02: attempt re-capped when the submission appears').toBe(new Date(submittedAt).getTime());
  await expectBoundary(students.s2, s.quizSub, attempt, fresh.deadline);
});

test('B02: adding a student to an existing submission re-syncs their in-progress attempt', async () => {
  const attempt = await startAttempt(students.s3, s.quizSub);
  expect((await (await students.s3.get(`/quizAttempts/${attempt.id}/`)).json()).deadline).toBeNull();

  // A submission that belongs to s4 only; s3 is attached afterwards (partner added by an admin).
  const submittedAt = new Date(Date.now() + CLOSE_IN_MS).toISOString();
  const created = await admin.post('/submissions/', {
    data: { assignment: s.assignmentSub, students: [s.students.s4], dateUploaded: submittedAt },
  });
  expect(created.status(), JSON.stringify(await json(created))).toBe(201);
  const submission = await created.json();
  expect((await (await students.s3.get(`/quizAttempts/${attempt.id}/`)).json()).deadline, 'unaffected before s3 is added').toBeNull();

  const patched = await admin.patch(`/submissions/${submission.id}/`, { data: { students: [s.students.s4, s.students.s3] } });
  expect(patched.ok(), JSON.stringify(await json(patched))).toBeTruthy();

  const fresh = await (await students.s3.get(`/quizAttempts/${attempt.id}/`)).json();
  expect(new Date(fresh.deadline).getTime()).toBe(new Date(submittedAt).getTime());
  await expectBoundary(students.s3, s.quizSub, attempt, fresh.deadline);
});
