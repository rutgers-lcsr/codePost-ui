// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
//
// Helpers for the gradebook e2e area: a throwaway-DB seed (seed_gradebook.py), per-user JWTs, and
// small wrappers around `manage.py`.
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import type { APIRequestContext, Page } from '@playwright/test';
import { API_URL } from '../constants';

const API_DIR = process.env.E2E_API_DIR ?? path.resolve(__dirname, '../../../codePost-api');
const PYTHON = process.env.E2E_PYTHON ?? path.join(API_DIR, '.venv/bin/python');

export interface Seed {
  courses: { grades: number; archived: number; target: number; other: number; sched: number; uiarchive: number };
  assignments: { lab1: number; lab2: number; lab3: number; archived: number; other: number; pub: number; rel: number };
  submissions: { archived: number; lateSub: number };
  rubric: { category: number; comment: number };
  emails: Record<string, string>;
  tokens: Record<string, string>;
}

/** Run a management command against the API worktree's SQLite DB (DEBUG, no DB_HOSTNAME). */
export function manage(args: string[], input?: string): string {
  const env = { ...process.env, DEBUG: 'TRUE' } as NodeJS.ProcessEnv;
  delete env.DB_HOSTNAME;
  return execFileSync(PYTHON, ['manage.py', ...args], { cwd: API_DIR, env, input, encoding: 'utf8' });
}

/** Rebuild every "GB " course and return ids + JWTs. Idempotent. */
export function seedGradebook(): Seed {
  const script = readFileSync(path.join(__dirname, 'seed_gradebook.py'), 'utf8');
  const out = manage(['shell'], script);
  const line = out.split('\n').find((l) => l.startsWith('SEED_JSON '));
  if (!line) throw new Error(`seed produced no SEED_JSON line:\n${out}`);
  return JSON.parse(line.slice('SEED_JSON '.length)) as Seed;
}

/** Run Python in the Django shell and return what it prints after the RESULT marker. */
export function shellJson<T>(code: string): T {
  const out = manage(['shell'], `${code}\n`);
  const line = out.split('\n').find((l) => l.startsWith('RESULT '));
  if (!line) throw new Error(`shell printed no RESULT line:\n${out}`);
  return JSON.parse(line.slice('RESULT '.length)) as T;
}

export const auth = (token: string) => ({ Authorization: `Bearer ${token}` });

/** Audit events of one type for a course through the real endpoint. */
export async function auditEvents(
  request: APIRequestContext,
  token: string,
  courseId: number,
  eventType: string,
  assignmentId?: number,
) {
  const qs = new URLSearchParams({ event_type: eventType });
  if (assignmentId) qs.set('assignment', String(assignmentId));
  const resp = await request.get(`${API_URL}/courses/${courseId}/auditLog/?${qs}`, { headers: auth(token) });
  if (!resp.ok()) throw new Error(`auditLog ${resp.status()}`);
  const body = await resp.json();
  return (Array.isArray(body) ? body : body.results) as Array<{ eventType: string; meta: unknown; assignment: number }>;
}

/** Put a JWT in localStorage before the app boots, so the page loads signed in as that user. */
export async function signIn(page: Page, token: string) {
  await page.addInitScript((t) => window.localStorage.setItem('token', t), token);
}

export const adminCourseUrl = (name: string, section = '') =>
  `/admin/${encodeURIComponent(name)}/${encodeURIComponent('Fall 2026')}${section}`;
