// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
//
// Global setup: seeds a known course + the `QT · ` quiz matrix, then logs in as the seeded
// student via the DEBUG-only dev endpoint and saves the auth state the specs reuse.
//
// Prerequisites (documented, not automated here):
//   - The Django backend is running with DEBUG=TRUE (./start_dev.sh) on E2E_API_URL.
//   - A superuser exists (createtestusers / create_demo_course resolve the org from it).
import { test as setup, expect, request } from '@playwright/test';
import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { API_URL, BASE_URL, COURSE_NAME, COURSE_PERIOD, STUDENT_EMAIL } from './constants';

const API_DIR = process.env.E2E_API_DIR ?? path.resolve(__dirname, '../../codePost-api');
const PYTHON = process.env.E2E_PYTHON ?? path.join(API_DIR, '.venv/bin/python');

const AUTH_DIR = path.join(__dirname, '.auth');

function manage(args: string[]) {
  // The dev management commands require DEBUG (start_dev.sh exports it, but a fresh subprocess
  // wouldn't inherit it). Keep the same SQLite DB the running server uses (DB_HOSTNAME unset).
  execFileSync(PYTHON, ['manage.py', ...args], { cwd: API_DIR, stdio: 'inherit', env: { ...process.env, DEBUG: 'TRUE' } });
}

setup('seed backend and save student auth state', async () => {
  // 1. Build a known course, users, and the QT quiz matrix (each step is idempotent).
  //    create_demo_course runs WITHOUT --reset: deleting the whole course is blocked once
  //    quiz attempts exist (QuizResponse.question is PROTECT). seed_test_quizzes does the clean
  //    QT reset itself (it deletes the quizzes first, cascading attempts, then the bank).
  manage(['createtestusers']);
  manage(['create_demo_course', '--course-name', COURSE_NAME, '--period', COURSE_PERIOD]);
  manage([
    'seed_test_quizzes',
    '--course-name', COURSE_NAME,
    '--course-period', COURSE_PERIOD,
    '--student', STUDENT_EMAIL,
  ]);

  // 2. Log in as the seeded student + instructor through the DEBUG-only dev endpoint → JWTs.
  const api = await request.newContext({ baseURL: API_URL });
  const loginAs = async (role: string): Promise<string> => {
    const resp = await api.post('/dev-auth/login-as/', { data: { role } });
    expect(
      resp.ok(),
      `dev-auth/login-as ${role} failed (${resp.status()}). Is the backend running with DEBUG=TRUE on ${API_URL}?`,
    ).toBeTruthy();
    const token = (await resp.json()).token as string;
    expect(token, `dev-auth/login-as ${role} returned no token`).toBeTruthy();
    return token;
  };
  const studentToken = await loginAs('student');
  const instructorToken = await loginAs('course_admin');
  await api.dispose();

  // 3. Persist the auth states the specs reuse: the JWT in localStorage.token for the app origin.
  mkdirSync(AUTH_DIR, { recursive: true });
  const authState = (token: string) =>
    JSON.stringify(
      { cookies: [], origins: [{ origin: BASE_URL, localStorage: [{ name: 'token', value: token }] }] },
      null,
      2,
    );
  writeFileSync(path.join(AUTH_DIR, 'student.json'), authState(studentToken));
  writeFileSync(path.join(AUTH_DIR, 'instructor.json'), authState(instructorToken));
});
