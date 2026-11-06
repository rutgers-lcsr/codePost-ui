// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
//
// B70: a student can belong to only one submission per assignment. Admin edits that would break the
// rule are refused with a readable `detail`/message; the same student on another assignment is fine.
import { test, expect, type APIRequestContext } from '@playwright/test';
import { apiAs, json, loginAs, seed, type Seed } from './helpers';

let s: Seed;
let admin: APIRequestContext;

test.beforeAll(async () => {
  s = seed('uniqueness', 'EQZ-unique ');
  admin = await apiAs(await loginAs('course_admin'));
});

test.afterAll(async () => {
  await admin.dispose();
});

const studentsOf = async (id: number): Promise<string[]> => (await (await admin.get(`/submissions/${id}/`)).json()).students;

test('adding a student who already has a submission on the assignment is refused', async () => {
  const resp = await admin.patch(`/submissions/${s.sub1}/`, { data: { students: [s.students.s1, s.students.s2] } });
  expect(resp.status()).toBe(400);
  const body = await json(resp);
  expect(JSON.stringify(body)).toContain(s.students.s2);
  expect(JSON.stringify(body)).toMatch(/already/i);
  // Nothing changed.
  expect(await studentsOf(s.sub1)).toEqual([s.students.s1]);
  expect(await studentsOf(s.sub2)).toEqual([s.students.s2]);
});

test('creating a second submission for a student who already has one is refused', async () => {
  const resp = await admin.post('/submissions/', { data: { assignment: s.assignment1, students: [s.students.s1] } });
  expect(resp.status()).toBe(400);
  expect(JSON.stringify(await json(resp))).toMatch(/already/i);
});

test('moving a submission onto an assignment where a member already has one is refused', async () => {
  // sub3 is s1 on assignment 2 and s1 also has sub1 on assignment 1: move sub3 to assignment 1.
  const resp = await admin.patch(`/submissions/${s.sub3}/`, { data: { assignment: s.assignment1 } });
  expect(resp.status()).toBe(400);
});

test('the same student on a different assignment is fine', async () => {
  const resp = await admin.patch(`/submissions/${s.sub3}/`, { data: { students: [s.students.s1, s.students.s2] } });
  expect(resp.status(), JSON.stringify(await json(resp))).toBe(200);
  expect((await studentsOf(s.sub3)).sort()).toEqual([s.students.s1, s.students.s2].sort());
});

test('re-saving a submission with its own students is not a conflict', async () => {
  const resp = await admin.patch(`/submissions/${s.sub1}/`, { data: { students: [s.students.s1] } });
  expect(resp.status(), JSON.stringify(await json(resp))).toBe(200);
});
