// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
//
// Helpers for the rubric e2e specs: seeding, role logins and API calls against the real server.
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { expect, request, type APIRequestContext, type BrowserContext, type Page } from '@playwright/test';
import { API_URL, COURSE_NAME, COURSE_PERIOD } from '../constants';

const API_DIR = process.env.E2E_API_DIR ?? path.resolve(__dirname, '../../../codePost-api');
const PYTHON = process.env.E2E_PYTHON ?? path.join(API_DIR, '.venv/bin/python');

export type Role = 'student' | 'grader_basic' | 'grader_rubric' | 'grader_super' | 'course_admin' | 'staff';

export const enc = (s: string) => encodeURIComponent(s);
export const graderBase = `/grader/${enc(COURSE_NAME)}/${enc(COURSE_PERIOD)}`;
export const adminBase = `/admin/${enc(COURSE_NAME)}/${enc(COURSE_PERIOD)}`;
export const graderRubricUrl = (assignment: string) => `${graderBase}/rubrics/${enc(assignment)}`;

/** Rebuild the RB assignments (see seed.py). Run once per spec file in beforeAll. */
export interface SeedInfo {
  standard: number;
  collab: number;
  flow: number;
  g2Submission: number;
  standardSub: number;
  g2Token: string;
  s2Token: string;
  courseId: number;
}
export function seedRubricData(): SeedInfo {
  const env = { ...process.env, DEBUG: 'TRUE' };
  delete env.DB_HOSTNAME;
  const out = execFileSync(PYTHON, ['manage.py', 'shell'], {
    cwd: API_DIR,
    input: readFileSync(path.join(__dirname, 'seed.py')),
    env,
    encoding: 'utf8',
  });
  const line = out.split('\n').find((l) => l.startsWith('RB_SEED_OK'));
  expect(line, out).toBeTruthy();
  return JSON.parse(line!.slice('RB_SEED_OK'.length));
}

const tokenCache: Partial<Record<Role, string>> = {};
export async function tokenFor(role: Role): Promise<string> {
  if (tokenCache[role]) return tokenCache[role]!;
  const api = await request.newContext({ baseURL: API_URL });
  const resp = await api.post('/dev-auth/login-as/', { data: { role } });
  expect(resp.ok(), `login-as ${role}: ${resp.status()}`).toBeTruthy();
  const token = (await resp.json()).token as string;
  await api.dispose();
  tokenCache[role] = token;
  return token;
}

/** An API client authenticated as `role` (or as an explicit JWT). */
export async function apiAs(who: Role | { token: string }): Promise<APIRequestContext> {
  const token = typeof who === 'string' ? await tokenFor(who) : who.token;
  return request.newContext({ baseURL: API_URL, extraHTTPHeaders: { Authorization: `Bearer ${token}` } });
}

/** Sign the browser context in as `role` (or an explicit JWT) before any page script runs. */
export async function signIn(context: BrowserContext, who: Role | { token: string }) {
  const token = typeof who === 'string' ? await tokenFor(who) : who.token;
  await context.addInitScript((t) => {
    try {
      window.localStorage.setItem('token', t);
    } catch {
      /* about:blank */
    }
  }, token);
}

/** Course admin flips Course.allowGradersToEditRubric straight through the API (the UI toggle has its own test). */
export async function setGraderRubricEditing(courseId: number, on: boolean) {
  const admin = await apiAs('course_admin');
  const res = await admin.patch(`/courses/${courseId}/`, { data: { allowGradersToEditRubric: on } });
  expect(res.ok(), await res.text()).toBeTruthy();
  await admin.dispose();
}

/** Record every request the page sends to the API (method + path) from now on. */
export function recordApiRequests(page: Page) {
  const seen: { method: string; url: string; body: string | null }[] = [];
  page.on('request', (r) => {
    if (r.url().startsWith(API_URL)) seen.push({ method: r.method(), url: r.url(), body: r.postData() });
  });
  return seen;
}
