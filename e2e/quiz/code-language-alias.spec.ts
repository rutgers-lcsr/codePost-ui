// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
//
// F5: a quiz code question's language is free text ("Python 3.12", "node.js", "C++17"...) and must
// still route to the right sandbox executor when staff run the answer; an unsupported language
// reports "No sandbox available". Runs the real Docker sandbox, so it needs the python:3.12 image
// locally. Only Python is exercised end to end here (the one image guaranteed present).
import { test, expect, type APIRequestContext } from '@playwright/test';
import { apiAs, json, loginAs, seed, type Seed } from './helpers';

let s: Seed;
let admin: APIRequestContext;
let student: APIRequestContext;

test.beforeAll(async () => {
  s = seed('code', 'EQZ-code ', 's1');
  admin = await apiAs(await loginAs('course_admin'));
  student = await apiAs(s.tokens.s1);
});

test.afterAll(async () => {
  await admin.dispose();
  await student.dispose();
});

test('a "Python 3.12" code answer runs in the Python sandbox; an unknown language says no sandbox', async () => {
  test.setTimeout(240_000);
  const started = await student.post('/quizAttempts/', { data: { quiz: s.quiz } });
  expect(started.status(), JSON.stringify(await json(started))).toBe(201);
  const attempt = await started.json();
  const [pyResp, otherResp] = attempt.responses;
  await student.patch(`/quizAttempts/${attempt.id}/saveAnswer/`, { data: { response: pyResp.id, answerText: 'print(6 * 7)' } });
  await student.patch(`/quizAttempts/${attempt.id}/saveAnswer/`, { data: { response: otherResp.id, answerText: '+++.' } });
  expect((await student.post(`/quizAttempts/${attempt.id}/submit/`)).ok()).toBeTruthy();

  for (const r of [pyResp, otherResp]) {
    const run = await admin.post(`/quizAttempts/${attempt.id}/runCode/`, { data: { response: r.id } });
    expect(run.status(), JSON.stringify(await json(run))).toBe(200);
  }

  const execution = async (id: number) => {
    let found: any;
    await expect.poll(async () => {
      const a = await (await admin.get(`/quizAttempts/${attempt.id}/`)).json();
      found = a.responses.find((x: any) => x.id === id)?.codeExecution;
      return found?.status;
    }, { timeout: 180_000, intervals: [2000] }).toMatch(/success|error/);
    return found;
  };

  const py = await execution(pyResp.id);
  expect(py.status, JSON.stringify(py)).toBe('success');
  expect(py.stdout).toContain('42');

  const other = await execution(otherResp.id);
  expect(other.status).toBe('error');
  expect(other.error).toMatch(/No sandbox available/);
});
