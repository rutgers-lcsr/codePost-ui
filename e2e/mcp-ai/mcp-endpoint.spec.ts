// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
//
// POST /mcp over real HTTP with real course API keys: scope-filtered tool lists, FERPA student
// aliases in every payload, and malformed calls answered as JSON-RPC errors (never a 500).
import { test, expect } from '@playwright/test';
import { STUDENT_EMAIL } from '../constants';
import {
  assignmentByName, createKey, demoCourse, getJson, loginAs, mcpBody, mcpRaw, McpClient, newApi, revokeKey, uniq,
  type CourseKey, type Json, type Session,
} from './helpers';

const ALIAS = /^student-[0-9a-f]{10}$/;

test.describe.serial('MCP endpoint with course API keys', () => {
  let admin: Session;
  let course: Json;
  let keys: Record<'read' | 'write' | 'admin', CourseKey>;
  let clients: Record<'read' | 'write' | 'admin', McpClient>;

  test.beforeAll(async () => {
    admin = await loginAs('course_admin');
    course = await demoCourse(admin);
    keys = {
      read: await createKey(admin, course.id, 'read'),
      write: await createKey(admin, course.id, 'write'),
      admin: await createKey(admin, course.id, 'admin'),
    };
    const api = await newApi();
    clients = {
      read: McpClient.forKey(api, keys.read),
      write: McpClient.forKey(api, keys.write),
      admin: McpClient.forKey(api, keys.admin),
    };
  });

  test.afterAll(async () => {
    for (const k of Object.values(keys ?? {})) await revokeKey(admin, k);
  });

  test('initialize answers per key and tools/list is filtered by key scope', async () => {
    for (const scope of ['read', 'write', 'admin'] as const) {
      const init = await clients[scope].initialize();
      expect(init.status).toBe(200);
      expect(init.body.result.serverInfo.name).toBe('codepost');
    }
    const read = await clients.read.toolNames();
    const write = await clients.write.toolNames();
    const adminTools = await clients.admin.toolNames();

    // Strictly nested tiers: a key never even sees the tools above its scope.
    expect(read.length).toBeGreaterThan(5);
    expect(write.length).toBeGreaterThan(read.length);
    expect(adminTools.length).toBeGreaterThan(write.length);
    for (const n of read) expect(write).toContain(n);
    for (const n of write) expect(adminTools).toContain(n);

    expect(read).toContain('codepost_get_course_overview');
    expect(read).not.toContain('codepost_update_roster');
    expect(read).not.toContain('codepost_delete_resource');
    expect(write).toContain('codepost_update_roster');
    expect(write).not.toContain('codepost_delete_resource');
    expect(write).not.toContain('codepost_notify_students_feedback_ready');
    expect(adminTools).toContain('codepost_delete_resource');
    expect(adminTools).toContain('codepost_reset_quiz_attempts');
    // A course key is pinned: no course picker tool.
    expect(adminTools).not.toContain('codepost_list_courses');
  });

  test('a tool above the key scope is refused as an unknown tool, not executed', async () => {
    const r = await clients.read.call('codepost_delete_resource', { resourceType: 'section', resourceId: 1 });
    expect(r.status).toBe(200);
    expect(r.body.error.code).toBe(-32601);
    const w = await clients.write.call('codepost_delete_resource', { resourceType: 'section', resourceId: 1 });
    expect(w.body.error.code).toBe(-32601);
  });

  test('missing, bogus and revoked credentials are 401, not a tool result', async () => {
    const api = await newApi();
    const ping = { jsonrpc: '2.0', id: 1, method: 'ping' };
    expect((await mcpRaw(api, null, ping)).status).toBe(401);
    expect((await mcpRaw(api, 'CourseKey cpk_999_deadbeef', ping)).status).toBe(401);

    const doomed = await createKey(admin, course.id, 'read');
    const client = McpClient.forKey(api, doomed);
    expect((await client.rpc('ping')).status).toBe(200);
    await revokeKey(admin, doomed);
    expect((await client.rpc('ping')).status).toBe(401);
  });

  test('student emails never leave the boundary: aliases are stable, staff emails pass through', async () => {
    const roster = await getJson(admin, `/courses/${course.id}/roster/`);
    const studentEmails: string[] = roster.students;
    expect(studentEmails).toContain(STUDENT_EMAIL);
    const staffEmails: string[] = [...roster.graders, ...roster.courseAdmins];

    const c = clients.read;
    const rosterCall = async () => (await c.ok('codepost_get_roster', { view: 'emails' })).content[0].text as string;
    const first = await rosterCall();
    const second = await rosterCall();

    for (const email of studentEmails) {
      expect(first, `student ${email} must not appear`).not.toContain(email);
      expect(first).not.toContain(email.split('@')[0]);
    }
    const members = JSON.parse(first).data.members as { email: string; role: string }[];
    const students = members.filter((m) => m.role === 'students');
    expect(students.length).toBe(studentEmails.length);
    for (const s of students) expect(s.email).toMatch(ALIAS);
    // Staff pass through unchanged.
    expect(members.filter((m) => m.role === 'graders').map((m) => m.email)).toEqual(roster.graders);
    for (const email of staffEmails) expect(first).toContain(email);
    // Stable across calls.
    expect(JSON.parse(second).data.members).toEqual(JSON.parse(first).data.members);
    const alias = students[0].email;

    const grades = (await c.ok('codepost_get_gradebook', { view: 'rows' })).content[0].text as string;
    expect(grades).not.toContain(STUDENT_EMAIL);
    expect(grades).toContain(alias);

    const a = await assignmentByName(admin, course, 'Defaults Only');
    const subs = await getJson(admin, `/assignments/${a.id}/submissions/`);
    const sub = (await c.ok('codepost_get_submission', { submissionId: subs[0].id })).content[0].text as string;
    expect(sub).not.toContain(STUDENT_EMAIL);
    expect(sub).toContain(alias);
  });

  test('sections and the audit log carry aliases only, even when the call used a real email', async () => {
    const w = clients.write;
    const name = uniq('s').slice(0, 16);
    const created = await w.ok('codepost_manage_sections', { op: 'create', name, dryRun: false });
    const sectionId = JSON.parse(created.content[0].text).data.section.id as number;

    // The model hands the tool the student's real email (a teacher might paste it).
    const set = await w.ok('codepost_manage_sections', {
      op: 'setMembers', sectionId, students: [STUDENT_EMAIL], dryRun: false,
    });
    const setText = set.content[0].text as string;
    expect(setText).not.toContain(STUDENT_EMAIL);
    const members = JSON.parse(setText).data.section.students as string[];
    expect(members).toHaveLength(1);
    expect(members[0]).toMatch(ALIAS);

    const audit = (await w.ok('codepost_get_audit_log', {})).content[0].text as string;
    expect(audit).not.toContain(STUDENT_EMAIL);
    expect(audit).not.toContain(STUDENT_EMAIL.split('@')[0]);
    expect(audit).toContain('codepost_manage_sections');

    // Clean up through the normal API so the spec stays re-runnable.
    const del = await admin.api.delete(`/sections/${sectionId}/`, { headers: admin.headers });
    expect([200, 204]).toContain(del.status());
  });
});

test.describe('MCP endpoint rejects malformed calls with JSON-RPC errors', () => {
  let admin: Session;
  let key: CourseKey;
  let client: McpClient;

  test.beforeAll(async () => {
    admin = await loginAs('course_admin');
    const course = await demoCourse(admin);
    key = await createKey(admin, course.id, 'admin');
    client = McpClient.forKey(await newApi(), key);
  });

  test.afterAll(async () => {
    if (key) await revokeKey(admin, key);
  });

  const rpcError = (r: { status: number; body: any; text: string }, code: number) => {
    expect(r.status, r.text).not.toBeGreaterThanOrEqual(500);
    expect(r.body?.error?.code, r.text).toBe(code);
    expect(r.body.error.message).toEqual(expect.any(String));
    // No internals: no tracebacks, file paths or exception class names.
    expect(r.text).not.toMatch(/Traceback|\.py|File "|TypeError|KeyError|AttributeError|django|rest_framework/);
  };

  test('params that are not an object are -32602', async () => {
    for (const params of [[1], 'x', 7, true]) {
      rpcError(await client.rpc('tools/call', params), -32602);
    }
  });

  test('tools/call arguments that are not an object are -32602, including falsy values', async () => {
    for (const args of [[1], 'x', 7, true, [], '', 0, false]) {
      rpcError(await client.call('codepost_get_course_overview', args), -32602);
    }
  });

  test('tools/call without a name, or with a non-string name, is -32602', async () => {
    rpcError(await client.rpc('tools/call', {}), -32602);
    rpcError(await client.rpc('tools/call', { name: 5 }), -32602);
    rpcError(await client.rpc('tools/call', { name: ['codepost_get_roster'] }), -32602);
  });

  test('unknown tool and unknown method are -32601', async () => {
    rpcError(await client.call('codepost_no_such_tool', {}), -32601);
    rpcError(await client.rpc('no/such/method'), -32601);
  });

  test('wrong argument types, missing required and extra arguments are -32602 naming the problem', async () => {
    const wrongType = await client.call('codepost_get_assignment', { assignmentId: 'abc' });
    rpcError(wrongType, -32602);
    expect(wrongType.body.error.message).toContain('assignmentId');

    const boolean = await client.call('codepost_get_assignment', { assignmentId: true });
    rpcError(boolean, -32602);

    const missing = await client.call('codepost_get_assignment', {});
    rpcError(missing, -32602);
    expect(missing.body.error.message).toContain('assignmentId');

    const extra = await client.call('codepost_get_course_overview', { bogus: 1 });
    rpcError(extra, -32602);
    expect(extra.body.error.message).toContain('bogus');

    const badEnum = await client.call('codepost_delete_resource', { resourceType: 'galaxy', resourceId: 1 });
    rpcError(badEnum, -32602);

    const nested = await client.call('codepost_get_roster', { roles: ['students', 'wizards'] });
    rpcError(nested, -32602);
  });

  test('invalid JSON-RPC envelopes are -32600 and malformed JSON is a 400, never a 500', async () => {
    const api = await newApi();
    const auth = client.auth;
    rpcError(await mcpRaw(api, auth, [{ jsonrpc: '2.0', id: 1, method: 'ping' }]), -32600);
    rpcError(await mcpRaw(api, auth, 'just a string'), -32600);
    rpcError(await mcpRaw(api, auth, { id: 1, method: 'ping' }), -32600);
    rpcError(await mcpRaw(api, auth, { jsonrpc: '2.0', id: 1, method: 5 }), -32600);

    const bad = await mcpBody(api, auth, '{not json');
    expect(bad.status).toBe(400);
    expect(bad.text).not.toMatch(/Traceback|File "/);
  });

  test('a notification gets 202 with no body and GET is 405', async () => {
    const api = await newApi();
    const note = await mcpRaw(api, client.auth, { jsonrpc: '2.0', method: 'notifications/initialized' });
    expect(note.status).toBe(202);
    expect(note.text).toBe('');
    const get = await api.get('/mcp', { headers: { Authorization: client.auth } });
    expect(get.status()).toBe(405);
  });
});
