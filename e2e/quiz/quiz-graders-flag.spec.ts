// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
//
// Who may grade quiz responses: with the course flag gradersCanGradeQuizzes on (the default) every
// grader can; with it off only course admins and the designated Quiz Graders can. Complements
// quiz-grading.spec.ts, which drives the instructor UI.
import { test, expect, type APIRequestContext } from '@playwright/test';
import { apiAs, json, loginAs, seed, type Seed } from './helpers';

let s: Seed;
let admin: APIRequestContext;
let grader: APIRequestContext;
let quizGrader: APIRequestContext;
let attempt: { id: number; responseId: number };

test.beforeAll(async () => {
  s = seed('grading', 'EQZ-grading ', 's1');
  admin = await apiAs(await loginAs('course_admin'));
  grader = await apiAs(await loginAs('grader_basic'));
  quizGrader = await apiAs(s.tokens.quizGrader);
  const student = await apiAs(s.tokens.s1);
  const started = await student.post('/quizAttempts/', { data: { quiz: s.quiz } });
  expect(started.status(), JSON.stringify(await json(started))).toBe(201);
  const body = await started.json();
  attempt = { id: body.id, responseId: body.responses[0].id };
  await student.patch(`/quizAttempts/${attempt.id}/saveAnswer/`, { data: { response: attempt.responseId, answerText: 'An essay.' } });
  expect((await student.post(`/quizAttempts/${attempt.id}/submit/`)).ok()).toBeTruthy();
  await student.dispose();
});

test.afterAll(async () => {
  await admin.patch(`/courses/${s.course}/`, { data: { gradersCanGradeQuizzes: true } });
  for (const api of [admin, grader, quizGrader]) await api.dispose();
});

const grade = (api: APIRequestContext, points: number) =>
  api.post(`/quizAttempts/${attempt.id}/gradeResponse/`, { data: { response: attempt.responseId, pointsEarned: points, graderFeedback: 'ok' } });

test('with gradersCanGradeQuizzes on, any grader can grade an essay', async () => {
  const resp = await grade(grader, 3);
  expect(resp.status(), JSON.stringify(await json(resp))).toBe(200);
});

test('with gradersCanGradeQuizzes off, only admins and designated Quiz Graders can', async () => {
  const off = await admin.patch(`/courses/${s.course}/`, { data: { gradersCanGradeQuizzes: false } });
  expect(off.ok(), JSON.stringify(await json(off))).toBeTruthy();

  const denied = await grade(grader, 4);
  expect(denied.status()).toBe(403);
  expect(typeof (await denied.json()).detail).toBe('string');

  expect((await grade(quizGrader, 4)).status(), 'designated Quiz Grader').toBe(200);
  expect((await grade(admin, 5)).status(), 'course admin').toBe(200);
});
