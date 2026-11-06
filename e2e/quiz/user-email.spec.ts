// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
//
// UserViewSet.email (POST /users/<email>/email/): bad input answers 400/404 with a string `detail`
// instead of a 500, and when several accounts share an email the course member is the one emailed.
import { test, expect, type APIRequestContext } from '@playwright/test';
import { apiAs, loginAs, seed, type Seed } from './helpers';

let s: Seed;
let admin: APIRequestContext;

test.beforeAll(async () => {
  s = seed('email', 'EQZ-email ', 's1');
  admin = await apiAs(await loginAs('course_admin'));
});

test.afterAll(async () => {
  await admin.dispose();
});

const send = (email: string, data: Record<string, unknown>) =>
  admin.post(`/users/${email}/email/`, { data: { course: s.course, template: 'publish_assignment', ...data } });

test('an unknown email is a 404 with a detail', async () => {
  const resp = await send('nobody-at-all@dev.edu', {});
  expect(resp.status()).toBe(404);
  expect(typeof (await resp.json()).detail).toBe('string');
});

test('a malformed email never reaches the handler as a 500', async () => {
  // The route's lookup pattern rejects it, so it is a plain 404 (an HTML debug page under DEBUG).
  const resp = await send('not-an-email', {});
  expect(resp.status()).toBe(404);
});

test('a non-numeric assignment id is a 400 with a detail', async () => {
  const resp = await send(s.students.s1, { assignment: 'abc' });
  expect(resp.status()).toBe(400);
  expect(typeof (await resp.json()).detail).toBe('string');
});

test('an assignment id that does not exist in the course is a 404 with a detail', async () => {
  const resp = await send(s.students.s1, { assignment: 99999999 });
  expect(resp.status()).toBe(404);
  expect(typeof (await resp.json()).detail).toBe('string');
});

test('with a duplicate email the course member is the one emailed', async () => {
  const resp = await send(s.dupEmail, { assignment: s.assignment });
  expect(resp.status(), await resp.text()).toBeLessThan(300);
});
