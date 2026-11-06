// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
//
// Environment Shell websocket (the one the Environment Shell widget opens): an environment
// whose Docker image is not available answers with an actionable message, a built one gives
// a working prompt.
import { test, expect } from '@playwright/test';
import { execFileSync } from 'node:child_process';
import { Api, ensureAssignment, loginAs, openShell, waitForBuild } from './helpers';

test.describe.configure({ mode: 'serial', timeout: 600_000 });

let admin: Api;

test.beforeAll(async () => {
  admin = new Api(await loginAs('course_admin'));
});

async function builtEnv(name: string): Promise<{ envId: number; imageName: string }> {
  const { envId } = await ensureAssignment(admin, name);
  await admin.call('PATCH', `/autograder/environments/${envId}/build/`, { language: 'python-3.12', requirements: '', autoDetect: false });
  expect((await waitForBuild(admin, envId)).isSuccess).toBe(true);
  const env = await admin.call('GET', `/autograder/environments/${envId}/`);
  return { envId, imageName: env.imageName };
}

test('a built environment gives a working shell prompt', async () => {
  const { envId } = await builtEnv('AG E2E Shell Built');
  const res = await openShell(admin.token, envId, { commands: ['echo ok-$((20+22))\n'], until: (t) => t.includes('ok-42') });
  expect(res.frames.some((f) => f?.type === 'ready')).toBe(true);
  expect(res.text).toContain('ok-42');
});

test('an environment whose image is not available gives no shell and no Docker detail', async () => {
  const { envId, imageName } = await builtEnv('AG E2E Shell Missing Image');
  execFileSync('docker', ['rmi', '-f', imageName]);
  // The in-process shell (this stack: no Redis worker relay) refuses the session before accepting
  // it; the "[Error] Docker image is not available" text only exists on the worker-relay path.
  const res = await openShell(admin.token, envId, { timeoutMs: 30_000 });
  expect(res.frames.some((f) => f?.type === 'ready')).toBe(false);
  expect(res.closeCode).not.toBeNull();
  expect(res.text).not.toContain(imageName);
  expect(res.text).not.toContain('Traceback');
});
