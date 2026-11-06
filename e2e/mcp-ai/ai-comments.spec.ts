// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
//
// AI comment generation against a local OpenAI-compatible stub provider: input validation
// (400), scoping of the linked rubric comment (404), provider failures (502 with a fixed
// message that never echoes the provider's text or the API key), configuration problems
// (400), and one real success driven through the grading console.
import { test, expect } from '@playwright/test';
import {
  assignmentByName, configureCourseAI, demoCourse, getJson, loginAs, StubProvider, STUB_LEAK, STUB_URL,
  type Json, type Session,
} from './helpers';

test.use({ storageState: 'e2e/.auth/instructor.json' });

const SUCCESS_TEXT = 'Stub comment: consider naming this variable more clearly.';

test.describe.serial('AI comment generation with a stub provider', () => {
  const stub = new StubProvider();
  let admin: Session;
  let course: Json;
  let fileId: number;
  let ownRubricComment: Json;
  let otherRubricComment: Json;
  let ownFile: Json;

  const generate = async (data: Json, who: Session = admin) =>
    who.api.post('/comments/generate/', { headers: who.headers, data });
  const base = () => ({ file_id: fileId, start_line: 0, end_line: 0 });

  async function rubricCommentOf(assignmentId: number): Promise<Json> {
    const a = await getJson(admin, `/assignments/${assignmentId}/`);
    const cat = await getJson(admin, `/rubricCategories/${a.rubricCategories[0]}/`);
    return getJson(admin, `/rubricComments/${cat.rubricComments[0]}/`);
  }

  test.beforeAll(async () => {
    await stub.start();
    admin = await loginAs('course_admin');
    course = await demoCourse(admin);
    const a = await assignmentByName(admin, course, 'Defaults Only');
    const b = await assignmentByName(admin, course, 'Student Upload');
    const subs = await getJson(admin, `/assignments/${a.id}/submissions/`);
    const sub = await getJson(admin, `/submissions/${subs[0].id}/`);
    ownFile = sub.files[0];
    fileId = ownFile.id;
    ownRubricComment = await rubricCommentOf(a.id);
    otherRubricComment = await rubricCommentOf(b.id);
    expect(otherRubricComment.id).not.toBe(ownRubricComment.id);
    await configureCourseAI(admin, course.id);
    await stub.mode('ok', { content: SUCCESS_TEXT });
  });

  test.afterAll(async () => {
    // Leave the course with no AI provider so other runs start unconfigured.
    await admin.api.patch(`/courses/${course.id}/aiSettings/`, {
      headers: admin.headers,
      data: { aiProvider: null, aiApiKey: '', aiBaseUrl: '', aiUseOwnSettings: false },
    });
    await stub.stop();
  });

  test('a valid request returns the provider text and sends the selected code to the provider', async () => {
    await stub.mode('ok', { content: SUCCESS_TEXT });
    const before = (await stub.requests()).length;
    const r = await generate({ ...base(), start_char: 4, end_char: 9 });
    expect(r.status()).toBe(200);
    expect((await r.json()).text).toBe(SUCCESS_TEXT);

    const seen = await stub.requests();
    expect(seen.length).toBe(before + 1);
    const sent = seen[seen.length - 1];
    expect(sent.model).toBe('stub-model');
    const prompt = JSON.stringify(sent.messages);
    // The selection within a single line is exactly [start_char, end_char).
    expect(sent.messages[1].content).toContain('```\nhello\n```');
    expect(prompt).not.toContain(STUB_LEAK);
  });

  test('a multi-line selection is sent whole, and an out-of-range one is clamped rather than a 500', async () => {
    const multi = await generate({ file_id: fileId, start_line: 0, end_line: 1 });
    expect(multi.status()).toBe(200);
    let sent = (await stub.requests()).at(-1)!;
    expect(sent.messages[1].content).toContain('def hello(name):');
    expect(sent.messages[1].content).toContain('Return a greeting.');

    const huge = await generate({ file_id: fileId, start_line: 8, end_line: 999 });
    expect(huge.status()).toBe(200);
    sent = (await stub.requests()).at(-1)!;
    expect(sent.messages[1].content).toContain('print(hello("world"))');
  });

  test('a rubric comment of the same assignment is put in the prompt', async () => {
    const r = await generate({ ...base(), rubric_comment_id: ownRubricComment.id });
    expect(r.status()).toBe(200);
    const sent = (await stub.requests()).at(-1)!;
    expect(sent.messages[1].content).toContain('Rubric Item:');
    expect(sent.messages[1].content).toContain(ownRubricComment.text);
  });

  test('a rubric comment of another assignment is 404 and nothing reaches the provider', async () => {
    const before = (await stub.requests()).length;
    const r = await generate({ ...base(), rubric_comment_id: otherRubricComment.id });
    expect(r.status()).toBe(404);
    expect((await r.json()).detail).toEqual(expect.any(String));
    const missing = await generate({ ...base(), rubric_comment_id: 99999999 });
    expect(missing.status()).toBe(404);
    expect((await stub.requests()).length).toBe(before);
  });

  test('malformed numbers and ids are 400, not 500, and never reach the provider', async () => {
    const before = (await stub.requests()).length;
    const bad: Json[] = [
      { ...base(), start_line: 'x' },
      { ...base(), end_line: { a: 1 } },
      { ...base(), start_line: 1.5 },
      { ...base(), start_line: true },
      { ...base(), start_char: 'abc' },
      { ...base(), end_char: [1] },
      { ...base(), points: 'lots' },
      { ...base(), rubric_comment_id: 'zz' },
      { file_id: fileId },
      { start_line: 0, end_line: 0 },
    ];
    for (const body of bad) {
      const r = await generate(body);
      expect(r.status(), JSON.stringify(body)).toBe(400);
      const json = await r.json();
      expect(typeof json.detail).toBe('string');
    }
    expect((await stub.requests()).length).toBe(before);

    const nofile = await generate({ ...base(), file_id: 99999999 });
    expect(nofile.status()).toBe(404);
    const strfile = await generate({ ...base(), file_id: 'abc' });
    expect(strfile.status()).toBe(404);
  });

  test('only staff of the submission may generate', async () => {
    const student = await loginAs('student');
    const r = await generate(base(), student);
    expect([403, 404]).toContain(r.status());
    const grader = await loginAs('grader_basic');
    const ok = await generate(base(), grader);
    expect(ok.status()).toBe(200);
  });

  for (const [mode, status, fragment] of [
    ['error500', 502, 'temporarily unavailable'],
    ['error401', 502, 'Authentication failed'],
    ['error429', 502, 'rate limit'],
  ] as const) {
    test(`stub answers ${mode.slice(5)}: API answers ${status} with a fixed message and none of the provider's text`, async () => {
      await stub.mode(mode);
      const r = await generate(base());
      const text = await r.text();
      expect(r.status(), text).toBe(status);
      const body = JSON.parse(text);
      expect(body.detail).toContain(fragment);
      expect(body.error).toContain(fragment);
      expect(text).not.toContain(STUB_LEAK);
      expect(text).not.toContain('upstream says');
      expect(text).not.toContain('e2e-stub-key');
      expect(text).not.toContain(STUB_URL);
      await stub.mode('ok', { content: SUCCESS_TEXT });
    });
  }

  test('an unreachable provider is a 502 connection message with no URL or exception text', async () => {
    await configureCourseAI(admin, course.id, { aiBaseUrl: 'http://127.0.0.1:1' });
    const r = await generate(base());
    const text = await r.text();
    expect(r.status(), text).toBe(502);
    expect(JSON.parse(text).detail).toContain('Failed to connect');
    expect(text).not.toMatch(/127\.0\.0\.1|Errno|Traceback|httpx/);
    await configureCourseAI(admin, course.id);
  });

  test('missing or disabled configuration is a 400 and never calls the provider', async () => {
    const before = (await stub.requests()).length;
    await admin.api.patch(`/courses/${course.id}/aiSettings/`, {
      headers: admin.headers,
      data: { aiProvider: null, aiApiKey: '' },
    });
    let r = await generate(base());
    expect(r.status()).toBe(400);
    expect((await r.json()).detail).toContain('AI is not available');

    await configureCourseAI(admin, course.id, { aiDisabled: true });
    r = await generate(base());
    expect(r.status()).toBe(400);

    await configureCourseAI(admin, course.id);
    expect((await stub.requests()).length).toBe(before);
  });

  test('a grader generates an AI comment from the grading console', async ({ page }) => {
    await stub.mode('ok', { content: SUCCESS_TEXT });
    // An unfinalized submission with one empty comment on its first file.
    const a = await assignmentByName(admin, course, 'Student Upload');
    const subs = await getJson(admin, `/assignments/${a.id}/submissions/`);
    const sub = subs.find((s: Json) => !s.isFinalized);
    expect(sub, 'seeded unfinalized submission').toBeTruthy();
    const detail = await getJson(admin, `/submissions/${sub.id}/`);
    const file = detail.files[0];
    const created = await admin.api.post('/comments/', {
      headers: admin.headers,
      data: { text: '', startChar: 0, endChar: 5, startLine: 0, endLine: 0, file: file.id },
    });
    expect(created.status()).toBe(201);
    const commentId = (await created.json()).id as number;

    try {
      await page.goto(`/code/${sub.id}`);
      // Focus the (empty) comment card; its editor then offers the Generate button.
      // (Capabilities load after first paint and a click before that is lost, so retry it.)
      const generateBtn = page.getByRole('button', { name: /Generate/ }).filter({ hasNotText: 'Suggestions' }).first();
      await expect(async () => {
        await page.getByText('Line 1').first().click();
        await expect(generateBtn).toBeVisible({ timeout: 2_000 });
      }).toPass({ timeout: 40_000 });
      const before = (await stub.requests()).length;
      await generateBtn.click();
      await expect
        .poll(async () => (await page.locator('textarea').evaluateAll((els) => els.map((e) => (e as HTMLTextAreaElement).value))).includes(SUCCESS_TEXT), {
          timeout: 30_000,
        })
        .toBe(true);
      expect((await stub.requests()).length).toBe(before + 1);
    } finally {
      await admin.api.delete(`/comments/${commentId}/`, { headers: admin.headers });
    }
  });
});
