// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
//
// Environment auto-detection from uploaded assignment files: a JavaScript notebook is node
// (not java), and an uploaded package.json is the base manifest the detected packages merge into.
import { test, expect } from '@playwright/test';
import { Api, ensureAssignment, loginAs, waitForBuild, type Json } from './helpers';

test.describe.configure({ mode: 'serial', timeout: 900_000 });

let admin: Api;

test.beforeAll(async () => {
  admin = new Api(await loginAs('course_admin'));
});

/** Reset an assignment to "auto-detect, no files" and upload `files`; returns the detected environment. */
async function detectFrom(name: string, files: Record<string, string>): Promise<Json> {
  const { assignmentId, envId } = await ensureAssignment(admin, name);
  const a = await admin.call('GET', `/assignments/${assignmentId}/`);
  for (const f of (a.files ?? []) as Json[]) await admin.call('DELETE', `/assignmentFiles/${typeof f === 'number' ? f : f.id}/`);
  await admin.call('PATCH', `/autograder/environments/${envId}/`, { autoDetect: true });
  for (const [fileName, data] of Object.entries(files)) {
    const ext = '.' + fileName.split('.').pop();
    await admin.call('POST', '/assignmentFiles/', { assignment: assignmentId, name: fileName, data, extension: ext, path: fileName });
  }
  // Detection (and the build it starts) runs inside the upload request, Celery being eager.
  await waitForBuild(admin, envId);
  return admin.call('GET', `/autograder/environments/${envId}/`);
}

const notebook = (language: string, source: string) =>
  JSON.stringify({
    cells: [{ cell_type: 'code', execution_count: null, metadata: {}, outputs: [], source: [source] }],
    metadata: { kernelspec: { name: language, display_name: language, language }, language_info: { name: language } },
    nbformat: 4,
    nbformat_minor: 5,
  });

test('a JavaScript notebook is detected as a node environment', async () => {
  const env = await detectFrom('AG E2E Detect Notebook', { 'analysis.ipynb': notebook('javascript', "console.log('hi')") });
  expect(env.language).toMatch(/^node/);
  expect(env.language).not.toMatch(/java-/);
});

test('an uploaded package.json is the base manifest for the detected node environment', async () => {
  const pkg = JSON.stringify({ name: 'ag-e2e', version: '1.2.3', scripts: { test: 'jest' }, dependencies: { chalk: '^4.1.2' } });
  const env = await detectFrom('AG E2E Detect Package', {
    'app.js': "const express = require('express');\nconsole.log(express);\n",
    'package.json': pkg,
  });
  expect(env.language).toMatch(/^node/);
  const reqs = JSON.parse(env.requirements);
  expect(reqs.name).toBe('ag-e2e');
  expect(reqs.scripts).toEqual({ test: 'jest' });
  expect(Object.keys(reqs.dependencies).sort()).toEqual(['chalk', 'express']);
  expect(reqs.dependencies.chalk).toBe('^4.1.2');
});
