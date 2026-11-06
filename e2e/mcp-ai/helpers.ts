// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
//
// Helpers for the mcp-ai e2e specs: real HTTP against the running API (no mocks), a local
// OpenAI-compatible stub provider, and the seeded Demo Course.
import { expect, request as pwRequest, type APIRequestContext } from '@playwright/test';
import { spawn, type ChildProcess } from 'node:child_process';
import path from 'node:path';
import { API_URL, COURSE_NAME, COURSE_PERIOD } from '../constants';

export const STUB_PORT = Number(process.env.E2E_STUB_PORT ?? 8151);
export const STUB_URL = `http://127.0.0.1:${STUB_PORT}`;
/** Marker the stub puts in every upstream error body; the API must never echo it. */
export const STUB_LEAK = 'STUB-LEAK-SECRET-sk-12345';

export type Json = Record<string, any>;
export type Role = 'student' | 'grader_basic' | 'grader_rubric' | 'grader_super' | 'course_admin' | 'staff';

export async function newApi(): Promise<APIRequestContext> {
  return pwRequest.newContext({ baseURL: API_URL });
}

export interface Session {
  api: APIRequestContext;
  headers: Record<string, string>;
  login: Json;
}

export async function loginAs(role: Role): Promise<Session> {
  const api = await newApi();
  const resp = await api.post('/dev-auth/login-as/', { data: { role } });
  expect(resp.ok(), `dev-auth login-as ${role}`).toBeTruthy();
  const login = await resp.json();
  return { api, headers: { Authorization: `Bearer ${login.token}` }, login };
}

/** The Demo Course the global setup seeds, as seen by the course admin. */
export async function demoCourse(s: Session): Promise<Json> {
  const course = (s.login.courseadminCourses as Json[]).find(
    (c) => c.name === COURSE_NAME && c.period === COURSE_PERIOD,
  );
  expect(course, 'Demo Course must be seeded').toBeTruthy();
  return course!;
}

export async function getJson(s: Session, url: string): Promise<any> {
  const resp = await s.api.get(url, { headers: s.headers });
  expect(resp.ok(), `GET ${url} -> ${resp.status()}`).toBeTruthy();
  return resp.json();
}

/** Find a seeded assignment by its (partial) name. */
export async function assignmentByName(s: Session, course: Json, fragment: string): Promise<Json> {
  for (const id of course.assignments as number[]) {
    const a = await getJson(s, `/assignments/${id}/`);
    if (String(a.name).includes(fragment)) return a;
  }
  throw new Error(`assignment ${fragment} not found`);
}

export function uniq(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}${Math.floor(Math.random() * 1e4)}`;
}

// ---------------------------------------------------------------------------------------
// Course API keys + MCP over HTTP
// ---------------------------------------------------------------------------------------
export type KeyScope = 'read' | 'write' | 'admin';

export interface CourseKey {
  id: number;
  raw: string;
  courseId: number;
}

export async function createKey(s: Session, courseId: number, scope: KeyScope): Promise<CourseKey> {
  const resp = await s.api.post(`/courses/${courseId}/apiKeys/`, {
    headers: s.headers,
    data: { name: uniq(`e2e-${scope}`), scope },
  });
  expect(resp.status(), 'create api key').toBe(201);
  const body = await resp.json();
  return { id: body.id, raw: body.key, courseId };
}

export async function revokeKey(s: Session, key: CourseKey) {
  await s.api.delete(`/courses/${key.courseId}/apiKeys/${key.id}/`, { headers: s.headers });
}

let rpcId = 100;

export interface RpcReply {
  status: number;
  body: any;
  text: string;
}

/** POST /mcp with an arbitrary JSON-RPC payload. `auth` is the full Authorization header value. */
export async function mcpRaw(api: APIRequestContext, auth: string | null, payload: unknown, extra: Record<string, string> = {}): Promise<RpcReply> {
  return mcpBody(api, auth, JSON.stringify(payload), extra);
}

/** Same, but with the request body exactly as given (for invalid JSON). */
export async function mcpBody(api: APIRequestContext, auth: string | null, rawBody: string, extra: Record<string, string> = {}): Promise<RpcReply> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json', ...extra };
  if (auth) headers.Authorization = auth;
  // Serialised by hand so bare strings / numbers go out as valid JSON documents too.
  let resp = await api.post('/mcp', { headers, data: rawBody });
  // The per-course tool budget is 120/minute (AgentToolThrottle). Back-to-back runs can hit it;
  // wait out the advertised window rather than fail on infrastructure.
  for (let i = 0; i < 2 && resp.status() === 429; i++) {
    const wait = Math.min(Number(resp.headers()['retry-after'] ?? 30), 65);
    await new Promise((r) => setTimeout(r, wait * 1000 + 500));
    resp = await api.post('/mcp', { headers, data: rawBody });
  }
  const text = await resp.text();
  let body: any = null;
  try {
    body = JSON.parse(text);
  } catch {
    /* non-JSON */
  }
  return { status: resp.status(), body, text };
}

export class McpClient {
  constructor(
    readonly api: APIRequestContext,
    readonly auth: string,
  ) {}

  static forKey(api: APIRequestContext, key: CourseKey) {
    return new McpClient(api, `CourseKey ${key.raw}`);
  }

  rpc(method: string, params?: unknown) {
    const msg: Json = { jsonrpc: '2.0', id: ++rpcId, method };
    if (params !== undefined) msg.params = params;
    return mcpRaw(this.api, this.auth, msg);
  }

  async initialize() {
    return this.rpc('initialize', { protocolVersion: '2025-06-18', capabilities: {} });
  }

  async toolNames(): Promise<string[]> {
    const r = await this.rpc('tools/list');
    return (r.body.result.tools as Json[]).map((t) => t.name);
  }

  call(name: string, args?: unknown) {
    return this.rpc('tools/call', args === undefined ? { name } : { name, arguments: args });
  }

  /** tools/call that must succeed at the protocol level; returns the parsed structured payload. */
  async ok(name: string, args: unknown = {}): Promise<Json> {
    const r = await this.call(name, args);
    expect(r.status, r.text).toBe(200);
    expect(r.body.error, r.text).toBeUndefined();
    expect(r.body.result.isError, r.text.slice(0, 600)).toBe(false);
    return r.body.result;
  }
}

// ---------------------------------------------------------------------------------------
// Stub OpenAI-compatible provider
// ---------------------------------------------------------------------------------------
export class StubProvider {
  private proc: ChildProcess | null = null;

  async start() {
    this.proc = spawn('python3', [path.join(__dirname, 'stub_provider.py'), String(STUB_PORT)], { stdio: 'ignore' });
    const api = await pwRequest.newContext();
    for (let i = 0; i < 50; i++) {
      try {
        const r = await api.get(`${STUB_URL}/__requests`);
        if (r.ok()) {
          await api.dispose();
          return;
        }
      } catch {
        /* not up yet */
      }
      await new Promise((r) => setTimeout(r, 200));
    }
    await api.dispose();
    throw new Error(`stub provider did not start on ${STUB_URL}`);
  }

  async stop() {
    this.proc?.kill();
    this.proc = null;
  }

  async mode(mode: string, extra: Json = {}) {
    const api = await pwRequest.newContext();
    await api.post(`${STUB_URL}/__mode`, { data: { mode, ...extra } });
    await api.dispose();
  }

  async requests(): Promise<Json[]> {
    const api = await pwRequest.newContext();
    const r = await api.get(`${STUB_URL}/__requests`);
    const body = await r.json();
    await api.dispose();
    return body;
  }
}

/** Point the course's AI at the stub (own settings, `custom` OpenAI-compatible provider). */
export async function configureCourseAI(s: Session, courseId: number, overrides: Json = {}) {
  const resp = await s.api.patch(`/courses/${courseId}/aiSettings/`, {
    headers: s.headers,
    data: {
      aiUseOwnSettings: true,
      aiProvider: 'custom',
      aiApiKey: 'e2e-stub-key',
      aiBaseUrl: STUB_URL,
      aiModel: 'stub-model',
      aiDisabled: false,
      aiCommentsDisabled: false,
      ...overrides,
    },
  });
  expect(resp.ok(), `aiSettings -> ${resp.status()} ${await resp.text()}`).toBeTruthy();
}
