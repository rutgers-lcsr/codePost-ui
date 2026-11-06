// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
//
// Helpers for the autograder e2e specs: real HTTP against the running API, real Docker builds
// and runs. Everything is created through the API as the dev-auth course admin / student.
// The Python environment is reused across runs (found by assignment name) because a Docker
// image build is slow.
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { API_URL } from '../constants';

const API_DIR = process.env.E2E_API_DIR ?? path.resolve(__dirname, '../../../codePost-api');
const PYTHON = process.env.E2E_PYTHON ?? path.join(API_DIR, '.venv/bin/python');

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Json = any;

export async function loginAs(role: string): Promise<string> {
  const resp = await fetch(`${API_URL}/dev-auth/login-as/`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ role }),
  });
  if (!resp.ok) throw new Error(`login-as ${role}: ${resp.status}`);
  return (await resp.json()).token as string;
}

export class Api {
  constructor(public token: string) {}

  async raw(method: string, url: string, body?: unknown): Promise<{ status: number; body: Json }> {
    const resp = await fetch(`${API_URL}${url}`, {
      method,
      headers: { Authorization: `Bearer ${this.token}`, 'content-type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const text = await resp.text();
    let parsed: Json = text;
    try {
      parsed = JSON.parse(text);
    } catch {
      /* keep text */
    }
    return { status: resp.status, body: parsed };
  }

  async call(method: string, url: string, body?: unknown): Promise<Json> {
    const r = await this.raw(method, url, body);
    if (r.status >= 300) throw new Error(`${method} ${url} -> ${r.status} ${JSON.stringify(r.body).slice(0, 600)}`);
    return r.body;
  }
}

/** Run python in the API's Django shell (same SQLite DB the server uses). */
export function manage(code: string): string {
  return execFileSync(PYTHON, ['manage.py', 'shell', '-c', code], {
    cwd: API_DIR,
    env: { ...process.env, DEBUG: 'TRUE', DB_HOSTNAME: '' },
    encoding: 'utf8',
  });
}

export const TEST_SCRIPT = `
@test(name='test_visible', points=5, description='Visible addition')
def test_visible():
    assert add(2, 3) == 5, 'add(2, 3) should be 5'

@test(name='test_secret', points=5, description='Secret addition')
def test_secret():
    assert add(40, 2) == 42, 'secret add failed'

@test(name='test_bool_true', points=4, description='Bool true')
def test_bool_true():
    return 1 == 1

@test(name='test_bool_false', points=4, description='Bool false')
def test_bool_false():
    return 1 == 2
`;

export const GOOD_SOLUTION = 'def add(a, b):\n    return a + b\n';

const FIXTURE_NAME = 'AG E2E Python';

export interface Fixture {
  courseId: number;
  assignmentId: number;
  envId: number;
  categoryId: number;
  adminEmail: string;
  studentEmail: string;
  admin: Api;
  student: Api;
}

export async function waitForBuild(api: Api, envId: number, timeoutMs = 540_000) {
  const start = Date.now();
  for (;;) {
    const st = await api.call('GET', `/autograder/environments/${envId}/build_status/`);
    if (!st.inProgress) return st;
    if (Date.now() - start > timeoutMs) throw new Error(`build still running after ${timeoutMs}ms`);
    await new Promise((r) => setTimeout(r, 3000));
  }
}

export async function createSubmission(
  api: Api,
  assignmentId: number,
  students: string[],
  files: Record<string, string>,
): Promise<number> {
  // One submission per student per assignment: replace any left by an earlier run.
  const existing = await api.call('GET', `/assignments/${assignmentId}/submissions/?student=${students[0]}`);
  const old = (Array.isArray(existing) ? existing : existing.results ?? []).filter((s: Json) =>
    (s.students ?? []).includes(students[0]),
  );
  for (const s of old) await api.call('DELETE', `/submissions/${s.id}/`);
  const sub = await api.call('POST', '/submissions/', { assignment: assignmentId, students });
  for (const [name, data] of Object.entries(files)) {
    const ext = name.includes('.') ? '.' + name.split('.').pop() : '';
    await api.call('POST', '/submissionFiles/', { submission: sub.id, name, data, extension: ext, path: name });
  }
  return sub.id as number;
}

/** Run the tests for a submission (Celery is eager: returns after the run). */
export function runTests(api: Api, envId: number, submissionId: number) {
  return api.raw('PATCH', `/autograder/environments/${envId}/run/`, { submission: submissionId });
}

/** Results as a map by test function name, as the given user sees them. */
export async function testRows(api: Api, submissionId: number): Promise<Json[]> {
  return api.call('GET', `/submissions/${submissionId}/submissionTests/`);
}


/**
 * Find-or-create the shared Python assignment: environment built, one test category whose
 * test cases were synced by an instructor reference run. Idempotent.
 */
export async function ensureFixture(): Promise<Fixture> {
  const admin = new Api(await loginAs('course_admin'));
  const student = new Api(await loginAs('student'));
  const me = await admin.call('GET', '/users/me/');
  const stuMe = await student.call('GET', '/users/me/');
  const course = me.courseadminCourses.find((c: Json) => c.name === 'Demo Course');
  const courseId: number = course.id;

  let assignmentId: number | undefined;
  for (const id of course.assignments as number[]) {
    const a = await admin.call('GET', `/assignments/${id}/`);
    if (a.name === FIXTURE_NAME) {
      assignmentId = id;
      break;
    }
  }
  if (!assignmentId) {
    const a = await admin.call('POST', '/assignments/', { name: FIXTURE_NAME, course: courseId, points: 100 });
    assignmentId = a.id as number;
  }
  let a = await admin.call('GET', `/assignments/${assignmentId}/`);
  if (a.state !== 'published') await admin.call('PATCH', `/assignments/${assignmentId}/`, { state: 'published' });

  let env = a.environment
    ? await admin.call('GET', `/autograder/environments/${a.environment}/`)
    : await admin.call('POST', '/autograder/environments/', { assignment: assignmentId, language: 'python-3.12' });
  if (env.buildStatus !== 2) {
    await admin.call('PATCH', `/autograder/environments/${env.id}/build/`, {
      language: 'python-3.12',
      requirements: '',
      autoDetect: false,
    });
    const st = await waitForBuild(admin, env.id);
    if (!st.isSuccess) throw new Error(`fixture build failed:\n${st.logs}`);
    env = await admin.call('GET', `/autograder/environments/${env.id}/`);
  }
  await admin.call('PATCH', `/autograder/environments/${env.id}/`, { autoDetect: false, language: 'python-3.12', imageName: env.imageName });
  // re-read in case the PATCH reset something
  env = await admin.call('GET', `/autograder/environments/${env.id}/`);

  a = await admin.call('GET', `/assignments/${assignmentId}/`);
  let categoryId: number;
  if (a.testCategories?.length) {
    categoryId = a.testCategories[0];
  } else {
    const cat = await admin.call('POST', '/testCategories/', {
      name: 'Addition',
      assignment: assignmentId,
      testScript: TEST_SCRIPT,
      maxPoints: 18,
    });
    categoryId = cat.id;
  }
  // Reference run by the instructor syncs the TestCases from the script.
  const cat = await admin.call('GET', `/testCategories/${categoryId}/`);
  if (!cat.testCases.length) {
    const ref = await createSubmission(admin, assignmentId, [me.email], { 'reference.py': GOOD_SOLUTION });
    const r = await runTests(admin, env.id, ref);
    if (r.status >= 300) throw new Error(`reference run failed ${JSON.stringify(r.body)}`);
  }
  const cat2 = await admin.call('GET', `/testCategories/${categoryId}/`);
  for (const tcId of cat2.testCases as number[]) {
    const tc = await admin.call('GET', `/testCases/${tcId}/`);
    await admin.call('PATCH', `/testCases/${tcId}/`, { exposed: true, hidden: tc.functionName === 'test_secret' });
  }
  return { courseId, assignmentId, envId: env.id, categoryId, adminEmail: me.email, studentEmail: stuMe.email, admin, student };
}

/** Find-or-create an assignment by name in the Demo Course (published), with an unbuilt environment. */
export async function ensureAssignment(admin: Api, name: string): Promise<{ assignmentId: number; envId: number }> {
  const me = await admin.call('GET', '/users/me/');
  const course = me.courseadminCourses.find((c: Json) => c.name === 'Demo Course');
  let assignmentId: number | undefined;
  for (const id of course.assignments as number[]) {
    const a = await admin.call('GET', `/assignments/${id}/`);
    if (a.name === name) assignmentId = id;
  }
  if (!assignmentId) {
    assignmentId = (await admin.call('POST', '/assignments/', { name, course: course.id, points: 10 })).id as number;
  }
  const a = await admin.call('GET', `/assignments/${assignmentId}/`);
  if (a.state !== 'published') await admin.call('PATCH', `/assignments/${assignmentId}/`, { state: 'published' });
  const env = a.environment
    ? await admin.call('GET', `/autograder/environments/${a.environment}/`)
    : await admin.call('POST', '/autograder/environments/', { assignment: assignmentId, language: 'python-3.12' });
  return { assignmentId, envId: env.id };
}

export interface ShellFrames {
  frames: Json[];
  text: string;
  closeCode: number | null;
}

/**
 * Open the environment shell websocket (same URL and frames the Environment Shell widget uses),
 * optionally send `commands` once the session is ready, and collect frames until `until(text)`
 * is true, the socket closes, or the deadline passes.
 */
export function openShell(
  token: string,
  envId: number,
  opts: { commands?: string[]; until?: (text: string) => boolean; timeoutMs?: number } = {},
): Promise<ShellFrames> {
  const wsBase = API_URL.replace(/^http/i, 'ws');
  const qs = new URLSearchParams({ token, includeDatasets: 'false', includeAssignmentFiles: 'false', runPreScript: 'false', datasetIds: '' });
  const ws = new WebSocket(`${wsBase}/ws/autograder/environments/${envId}/shell/?${qs}`);
  const out: ShellFrames = { frames: [], text: '', closeCode: null };
  return new Promise((resolve) => {
    const finish = () => {
      clearTimeout(timer);
      try {
        ws.close();
      } catch {
        /* already closed */
      }
      resolve(out);
    };
    const timer = setTimeout(finish, opts.timeoutMs ?? 60_000);
    let sent = false;
    ws.onmessage = (ev) => {
      const raw = typeof ev.data === 'string' ? ev.data : Buffer.from(ev.data as ArrayBuffer).toString();
      let parsed: Json = null;
      try {
        parsed = JSON.parse(raw);
      } catch {
        /* plain shell output */
      }
      out.frames.push(parsed ?? raw);
      out.text += parsed?.type === 'data' ? parsed.data : parsed?.type === 'error' ? parsed.message : parsed ? '' : raw;
      if (parsed?.type === 'ready' && !sent) {
        sent = true;
        for (const c of opts.commands ?? []) ws.send(c);
      }
      if (opts.until?.(out.text)) finish();
    };
    ws.onerror = () => {
      // handshake refused before the socket was accepted
      out.closeCode = out.closeCode ?? 1006;
      finish();
    };
    ws.onclose = (ev) => {
      out.closeCode = ev.code;
      finish();
    };
  });
}
