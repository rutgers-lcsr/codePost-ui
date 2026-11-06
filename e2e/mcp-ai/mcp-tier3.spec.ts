// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
//
// Tier-3 confirmations without MCP elicitation: an admin-scope course key asks to delete
// something; the call is refused with a deep link and a PendingAgentAction row; the signed-in
// instructor approves it in Course Settings -> Pending agent actions; only then does the
// agent's retry execute, exactly once. The agent's own key can never decide its own action.
import { test, expect } from '@playwright/test';
import { COURSE_NAME, COURSE_PERIOD, STUDENT_EMAIL } from '../constants';
import {
  createKey, demoCourse, getJson, loginAs, McpClient, newApi, revokeKey, uniq,
  type CourseKey, type Json, type Session,
} from './helpers';

test.use({ storageState: 'e2e/.auth/instructor.json' });

test.describe.serial('Tier-3 approvals', () => {
  let admin: Session;
  let course: Json;
  let adminKey: CourseKey;
  let readKey: CourseKey;
  let agent: McpClient;

  const sectionName = () => uniq('t').slice(0, 16);

  async function makeSection(name: string, students: string[] = []): Promise<number> {
    const created = await agent.ok('codepost_manage_sections', { op: 'create', name, dryRun: false });
    const id = JSON.parse(created.content[0].text).data.section.id as number;
    if (students.length) {
      await agent.ok('codepost_manage_sections', { op: 'setMembers', sectionId: id, students, dryRun: false });
    }
    return id;
  }

  async function sectionExists(id: number): Promise<boolean> {
    const r = await admin.api.get(`/sections/${id}/`, { headers: admin.headers });
    return r.status() === 200;
  }

  const requestDelete = (sectionId: number) =>
    agent.call('codepost_delete_resource', { resourceType: 'section', resourceId: sectionId });

  const errorOf = (r: { body: any }) => JSON.parse(r.body.result.content[0].text).error as Json;

  const pending = async (): Promise<Json[]> => getJson(admin, `/courses/${course.id}/pendingAgentActions/`);

  test.beforeAll(async () => {
    admin = await loginAs('course_admin');
    course = await demoCourse(admin);
    adminKey = await createKey(admin, course.id, 'admin');
    readKey = await createKey(admin, course.id, 'read');
    agent = McpClient.forKey(await newApi(), adminKey);
  });

  test.afterAll(async () => {
    if (adminKey) await revokeKey(admin, adminKey);
    if (readKey) await revokeKey(admin, readKey);
  });

  test('a destructive call without approval is refused with a deep link and creates a pending action', async () => {
    const name = sectionName();
    const id = await makeSection(name);

    const r = await requestDelete(id);
    expect(r.status).toBe(200);
    expect(r.body.result.isError).toBe(true);
    const err = errorOf(r);
    expect(err.code).toBe('CONFIRMATION_REQUIRED');
    expect(err.retryable).toBe(true);
    expect(err.context.approveUrl).toContain(
      `/admin/${encodeURIComponent(COURSE_NAME)}/${encodeURIComponent(COURSE_PERIOD)}/settings?section=pending-agent-actions`,
    );
    expect(err.remedy).toContain(err.context.approveUrl);
    expect(await sectionExists(id)).toBe(true);

    const rows = (await pending()).filter((p) => p.plan?.name === name);
    expect(rows).toHaveLength(1);
    expect(rows[0].tool).toBe('codepost_delete_resource');
    expect(rows[0].status).toBe('pending');

    // Asking again for the same operation does not mint a second row.
    await requestDelete(id);
    expect((await pending()).filter((p) => p.plan?.name === name)).toHaveLength(1);

    // Clean up: deny so nothing is left to approve.
    await admin.api.post(`/courses/${course.id}/pendingAgentActions/${rows[0].id}/deny/`, { headers: admin.headers });
    await admin.api.delete(`/sections/${id}/`, { headers: admin.headers });
  });

  test('the agent cannot see, approve or deny pending actions with its own course key', async () => {
    const name = sectionName();
    const id = await makeSection(name);
    await requestDelete(id);
    const row = (await pending()).find((p) => p.plan?.name === name)!;
    expect(row).toBeTruthy();

    const api = await newApi();
    for (const key of [adminKey, readKey]) {
      const headers = { Authorization: `CourseKey ${key.raw}` };
      expect((await api.get(`/courses/${course.id}/pendingAgentActions/`, { headers })).status()).toBe(403);
      const approve = await api.post(`/courses/${course.id}/pendingAgentActions/${row.id}/approve/`, { headers });
      expect(approve.status()).toBe(403);
      expect((await approve.json()).detail).toEqual(expect.any(String));
      expect((await api.post(`/courses/${course.id}/pendingAgentActions/${row.id}/deny/`, { headers })).status()).toBe(403);
    }
    // Nothing changed: still pending, still not executed.
    expect((await pending()).find((p) => p.id === row.id)?.status).toBe('pending');
    expect((await requestDelete(id)).body.result.isError).toBe(true);
    expect(await sectionExists(id)).toBe(true);

    await admin.api.post(`/courses/${course.id}/pendingAgentActions/${row.id}/deny/`, { headers: admin.headers });
    await admin.api.delete(`/sections/${id}/`, { headers: admin.headers });
  });

  test('the instructor approves in Course Settings, and the agent retry then executes exactly once', async ({ page }) => {
    const name = sectionName();
    const id = await makeSection(name);
    const first = errorOf(await requestDelete(id));
    expect(first.code).toBe('CONFIRMATION_REQUIRED');

    // Follow the exact link the agent hands the user.
    const link = new URL(first.context.approveUrl as string);
    await page.goto(`${link.pathname}${link.search}`);
    const row = page.getByTestId('pending-agent-actions-table').getByRole('row').filter({ hasText: name });
    await expect(row).toBeVisible();
    await row.getByTestId('approve-agent-action').click();
    await page.locator('.ant-popover').getByRole('button', { name: 'OK' }).click();
    await expect(row.getByText('Approved — waiting for the agent')).toBeVisible();

    // Approving does not execute by itself.
    expect(await sectionExists(id)).toBe(true);

    // The retry consumes the approval and performs the delete.
    const done = await agent.call('codepost_delete_resource', { resourceType: 'section', resourceId: id });
    expect(done.body.result.isError, done.text).toBe(false);
    expect(done.body.result.structuredContent.data.deleted).toMatchObject({ type: 'section', id });
    expect(await sectionExists(id)).toBe(false);

    // The approval was single-use and the row is gone from the queue.
    expect((await pending()).find((p) => p.plan?.name === name)).toBeUndefined();
    const again = await agent.call('codepost_delete_resource', { resourceType: 'section', resourceId: id });
    expect(again.body.result.isError).toBe(true);

    // The decision is in the audit log.
    const audit = (await agent.ok('codepost_get_audit_log', { eventType: 'agent_action_approved' })).content[0].text as string;
    expect(audit).toContain('agent_action_approved');
  });

  test('an approval is single-use: the next request for another section needs its own approval', async () => {
    const a = await makeSection(sectionName());
    const b = await makeSection(sectionName());
    const nameA = errorOf(await requestDelete(a)).context.plan.name as string;
    const rowA = (await pending()).find((p) => p.plan?.name === nameA)!;
    const approve = await admin.api.post(`/courses/${course.id}/pendingAgentActions/${rowA.id}/approve/`, { headers: admin.headers });
    expect(approve.status()).toBe(204);

    // The approval for A does not authorise B.
    expect(errorOf(await requestDelete(b)).code).toBe('CONFIRMATION_REQUIRED');
    expect(await sectionExists(b)).toBe(true);
    expect((await requestDelete(a)).body.result.isError).toBe(false);
    expect(await sectionExists(a)).toBe(false);

    const nameB = errorOf(await requestDelete(b)).context.plan.name as string;
    const rowB = (await pending()).find((p) => p.plan?.name === nameB);
    if (rowB) await admin.api.post(`/courses/${course.id}/pendingAgentActions/${rowB.id}/deny/`, { headers: admin.headers });
    await admin.api.delete(`/sections/${b}/`, { headers: admin.headers });
  });

  test('a denial sticks: the retry is CONFIRMATION_DENIED and not retryable', async () => {
    const id = await makeSection(sectionName());
    const name = errorOf(await requestDelete(id)).context.plan.name as string;
    const row = (await pending()).find((p) => p.plan?.name === name)!;
    expect(row).toBeTruthy();
    const deny = await admin.api.post(`/courses/${course.id}/pendingAgentActions/${row.id}/deny/`, { headers: admin.headers });
    expect(deny.status()).toBe(204);

    const err = errorOf(await requestDelete(id));
    expect(err.code).toBe('CONFIRMATION_DENIED');
    expect(err.retryable).toBe(false);
    expect(await sectionExists(id)).toBe(true);
    // A denied row cannot be approved afterwards.
    const late = await admin.api.post(`/courses/${course.id}/pendingAgentActions/${row.id}/approve/`, { headers: admin.headers });
    expect(late.status()).toBe(409);

    await admin.api.delete(`/sections/${id}/`, { headers: admin.headers });
  });

  test('an approval dies when the blast radius changes before the retry', async () => {
    const id = await makeSection(sectionName());
    const err1 = errorOf(await requestDelete(id));
    const name = err1.context.plan.name as string;
    const row = (await pending()).find((p) => p.plan?.name === name)!;
    await admin.api.post(`/courses/${course.id}/pendingAgentActions/${row.id}/approve/`, { headers: admin.headers });

    // The section gains a member after the human approved a delete of an empty section.
    await agent.ok('codepost_manage_sections', { op: 'setMembers', sectionId: id, students: [STUDENT_EMAIL], dryRun: false });

    const retry = errorOf(await requestDelete(id));
    expect(retry.code).toBe('CONFIRMATION_REQUIRED');
    expect(retry.message).toContain('invalidated');
    expect(await sectionExists(id)).toBe(true);
    const fresh = (await pending()).filter((p) => p.plan?.name === name);
    expect(fresh).toHaveLength(1);
    expect(fresh[0].id).not.toBe(row.id);
    expect(fresh[0].status).toBe('pending');

    await admin.api.post(`/courses/${course.id}/pendingAgentActions/${fresh[0].id}/deny/`, { headers: admin.headers });
    await admin.api.delete(`/sections/${id}/`, { headers: admin.headers });
  });
});
