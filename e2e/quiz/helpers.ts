// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
//
// Helpers for the quiz e2e area: seeds area-specific data through the backend's manage.py shell
// (same pattern as global.setup.ts) and wraps authenticated HTTP calls.
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { expect, request, type APIRequestContext, type APIResponse } from '@playwright/test';
import { API_URL } from '../constants';

const API_DIR = process.env.E2E_API_DIR ?? path.resolve(__dirname, '../../../codePost-api');
const PYTHON = process.env.E2E_PYTHON ?? path.join(API_DIR, '.venv/bin/python');

export interface Seed {
  course: number;
  tokens: Record<string, string>;
  students: Record<string, string>;
  [key: string]: any;
}

/** Run seed.py for one scenario. Idempotent: it wipes whatever it created under `prefix` first. */
export function seed(scenario: string, prefix: string, students = 's1,s2'): Seed {
  const stdout = execFileSync(PYTHON, ['manage.py', 'shell'], {
    cwd: API_DIR,
    input: require('node:fs').readFileSync(path.join(__dirname, 'seed.py')),
    env: { ...process.env, DEBUG: 'TRUE', E2EQZ_SCENARIO: scenario, E2EQZ_PREFIX: prefix, E2EQZ_STUDENTS: students },
    maxBuffer: 16 * 1024 * 1024,
  }).toString();
  const line = stdout.split('\n').find((l) => l.startsWith('E2EQZ_JSON:'));
  if (!line) throw new Error(`seed.py printed no result:\n${stdout}`);
  return JSON.parse(line.slice('E2EQZ_JSON:'.length));
}

/** Log in through the DEBUG-only dev endpoint and return a JWT. */
export async function loginAs(role: string): Promise<string> {
  const api = await request.newContext({ baseURL: API_URL });
  const resp = await api.post('/dev-auth/login-as/', { data: { role } });
  expect(resp.ok(), `dev-auth/login-as ${role} -> ${resp.status()}`).toBeTruthy();
  const token = (await resp.json()).token as string;
  await api.dispose();
  return token;
}

/** An API client that sends a Bearer JWT with every call. */
export async function apiAs(token: string): Promise<APIRequestContext> {
  return request.newContext({ baseURL: API_URL, extraHTTPHeaders: { Authorization: `Bearer ${token}` } });
}

export async function json(resp: APIResponse): Promise<any> {
  return resp.json().catch(() => ({}));
}

/** Sleep until `iso` (server clock string) has passed by `extraMs`, measured on the local clock. */
export async function waitUntilPast(iso: string, extraMs = 0) {
  const ms = new Date(iso).getTime() + extraMs - Date.now();
  if (ms > 0) await new Promise((r) => setTimeout(r, ms));
}
