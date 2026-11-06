// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
//
// AI quiz-question suggestions against a local OpenAI-compatible stub provider: a failed run
// marks its job failed with a fixed message (never provider or exception text) and keeps the
// instructor's pending queue; unusable items among good ones are skipped; a clean run replaces
// the queue.
import { test, expect } from '@playwright/test';
import {
  assignmentByName, configureCourseAI, demoCourse, getJson, loginAs, StubProvider, STUB_LEAK, STUB_URL, uniq,
  type Json, type Session,
} from './helpers';

const good = (text: string): Json => ({
  type: 'multiple_choice',
  text,
  points: 1,
  choices: [
    { text: 'A', isCorrect: true },
    { text: 'B', isCorrect: false },
  ],
});

test.describe.serial('AI quiz suggestions with a stub provider', () => {
  const stub = new StubProvider();
  let admin: Session;
  let staff: Session;
  let course: Json;
  let assignment: Json;
  const variantIds: number[] = [];

  async function newVariant(name: string, text: string, activate: boolean): Promise<number> {
    const created = await staff.api.post('/promptVariants/', {
      headers: staff.headers,
      data: { promptType: 'quiz_generation', name: `${name}-${uniq('v')}`, text, status: 'draft' },
    });
    expect(created.status(), await created.text()).toBe(201);
    const id = (await created.json()).id as number;
    variantIds.push(id);
    if (activate) {
      const act = await staff.api.post(`/promptVariants/${id}/activate/`, { headers: staff.headers });
      expect(act.ok()).toBeTruthy();
    }
    return id;
  }

  const GOOD_PROMPT = 'Write {num_questions} quiz questions about {assignment_name}. Types: {question_types}.';

  async function run(): Promise<{ http: number; job: Json; pending: Json[] }> {
    const resp = await admin.api.post(`/assignments/${assignment.id}/generateQuizQuestions/`, {
      headers: admin.headers,
      data: { num_questions: 3 },
    });
    const started = await resp.json();
    // Eager Celery in the e2e stack: the job is already terminal when the POST returns, but poll anyway.
    let job: Json = started;
    for (let i = 0; i < 40 && !['completed', 'failed'].includes(job.status); i++) {
      await new Promise((r) => setTimeout(r, 250));
      job = await getJson(admin, `/quizSuggestionJobs/${started.id}/`);
    }
    job = await getJson(admin, `/quizSuggestionJobs/${started.id}/`);
    return { http: resp.status(), job, pending: await pendingSuggestions() };
  }

  const pendingSuggestions = async (): Promise<Json[]> => {
    const rows: Json[] = await getJson(admin, `/assignments/${assignment.id}/suggestedQuizQuestions/`);
    return rows.filter((r) => r.status === 'pending');
  };

  const texts = (rows: Json[]) => rows.map((r) => r.text as string).sort();

  test.beforeAll(async () => {
    await stub.start();
    admin = await loginAs('course_admin');
    staff = await loginAs('staff');
    course = await demoCourse(admin);
    assignment = await assignmentByName(admin, course, 'Hidden');
    await configureCourseAI(admin, course.id);
    await newVariant('e2e-good', GOOD_PROMPT, true);
  });

  test.afterAll(async () => {
    // Retire and delete the variants we added; the cached prompt (identical text) expires on its own.
    for (const id of variantIds) {
      await staff.api.patch(`/promptVariants/${id}/`, { headers: staff.headers, data: { status: 'retired' } });
      await staff.api.delete(`/promptVariants/${id}/`, { headers: staff.headers });
    }
    await admin.api.patch(`/courses/${course.id}/aiSettings/`, {
      headers: admin.headers,
      data: { aiProvider: null, aiApiKey: '', aiBaseUrl: '', aiUseOwnSettings: false },
    });
    await stub.stop();
  });

  test('a clean run completes its job and replaces the pending queue', async () => {
    const first = [good('First batch Q1?'), good('First batch Q2?')];
    await stub.mode('ok', { content: JSON.stringify(first) });
    const r1 = await run();
    expect(r1.http).toBe(202);
    expect(r1.job.status).toBe('completed');
    expect(r1.job.createdCount).toBe(2);
    expect(r1.job.errorMessage).toBe('');
    expect(texts(r1.pending)).toEqual(['First batch Q1?', 'First batch Q2?']);

    await stub.mode('ok', { content: JSON.stringify([good('Second batch Q1?')]) });
    const r2 = await run();
    expect(r2.job.status).toBe('completed');
    expect(texts(r2.pending)).toEqual(['Second batch Q1?']);
  });

  test('a provider 500 fails the job with a fixed message and keeps the pending queue', async () => {
    const before = await pendingSuggestions();
    expect(before.length).toBeGreaterThan(0);

    await stub.mode('error500');
    const r = await run();
    expect(r.http).toBe(202);
    expect(r.job.status).toBe('failed');
    expect(r.job.createdCount).toBe(0);
    expect(r.job.errorMessage).toContain('temporarily unavailable');
    const blob = JSON.stringify(r.job);
    expect(blob).not.toContain(STUB_LEAK);
    expect(blob).not.toContain('upstream says');
    expect(blob).not.toContain('e2e-stub-key');
    expect(blob).not.toContain(STUB_URL);
    expect(r.pending.map((p) => p.id).sort()).toEqual(before.map((p) => p.id).sort());
  });

  test('a provider 401 fails the job with the authentication message, still without provider text', async () => {
    const before = await pendingSuggestions();
    await stub.mode('error401');
    const r = await run();
    expect(r.job.status).toBe('failed');
    expect(r.job.errorMessage).toContain('Authentication failed');
    expect(JSON.stringify(r.job)).not.toContain(STUB_LEAK);
    expect(r.pending.map((p) => p.id).sort()).toEqual(before.map((p) => p.id).sort());
  });

  test('output that is not JSON fails the job and keeps the queue', async () => {
    const before = await pendingSuggestions();
    await stub.mode('ok', { content: 'Sorry, I cannot produce JSON today.' });
    const r = await run();
    expect(r.job.status).toBe('failed');
    expect(r.job.errorMessage).toContain('could not be parsed');
    expect(r.pending.map((p) => p.id).sort()).toEqual(before.map((p) => p.id).sort());
  });

  test('unusable items among good ones are skipped and the good ones are kept', async () => {
    await stub.mode('ok', {
      content: JSON.stringify([good('Kept Q1?'), { type: 'essay', text: '' }, 'not an object', { bogus: true }, good('Kept Q2?')]),
    });
    const r = await run();
    expect(r.job.status).toBe('completed');
    expect(r.job.createdCount).toBe(2);
    expect(texts(r.pending)).toEqual(['Kept Q1?', 'Kept Q2?']);
  });

  test('an item the database rejects fails the run with a generic message and keeps the previous queue', async () => {
    const before = await pendingSuggestions();
    expect(texts(before)).toEqual(['Kept Q1?', 'Kept Q2?']);
    await stub.mode('ok', {
      content: JSON.stringify([good('Rolled back Q1?'), { ...good('Bad points'), points: 'five' }, good('Rolled back Q2?')]),
    });
    const r = await run();
    expect(r.job.status).toBe('failed');
    expect(r.job.errorMessage).toContain('could not be saved');
    expect(r.job.errorMessage).not.toMatch(/five|ValidationError|float/i);
    // Nothing from the failed batch leaked in; the old suggestions are untouched.
    expect(r.pending.map((p) => p.id).sort()).toEqual(before.map((p) => p.id).sort());
  });

  test('an unexpected exception while generating is a fixed message, not the exception text', async () => {
    const before = await pendingSuggestions();
    // A superuser's active prompt that fails to format raises inside the task (not a provider error).
    await newVariant('e2e-broken', 'Questions about {assignment_name.nope_attr} {explanation[99999]}', true);
    try {
      await stub.mode('ok', { content: JSON.stringify([good('Never saved?')]) });
      const r = await run();
      expect(r.job.status).toBe('failed');
      expect(r.job.errorMessage).toBeTruthy();
      expect(r.job.errorMessage).not.toMatch(/nope_attr|attribute|IndexError|index|object|Traceback/i);
      expect(r.pending.map((p) => p.id).sort()).toEqual(before.map((p) => p.id).sort());
    } finally {
      await newVariant('e2e-good-again', GOOD_PROMPT, true);
    }
  });

  test('without a configured provider the job fails with the configuration message', async () => {
    const before = await pendingSuggestions();
    await admin.api.patch(`/courses/${course.id}/aiSettings/`, {
      headers: admin.headers,
      data: { aiProvider: null, aiApiKey: '' },
    });
    try {
      const resp = await admin.api.post(`/assignments/${assignment.id}/generateQuizQuestions/`, { headers: admin.headers, data: {} });
      // Either the capability gate refuses up front (403) or the job records the configuration problem.
      if (resp.status() === 202) {
        const job = await getJson(admin, `/quizSuggestionJobs/${(await resp.json()).id}/`);
        expect(job.status).toBe('failed');
        expect(job.errorMessage).toMatch(/not configured|turned off|disabled/i);
      } else {
        expect([400, 403]).toContain(resp.status());
        expect(typeof (await resp.json()).detail).toBe('string');
      }
      expect((await pendingSuggestions()).map((p) => p.id).sort()).toEqual(before.map((p) => p.id).sort());
    } finally {
      await configureCourseAI(admin, course.id);
    }
  });
});
