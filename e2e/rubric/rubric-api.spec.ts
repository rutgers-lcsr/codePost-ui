// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
//
// Grader rubric editing at the HTTP level: Course.allowGradersToEditRubric, the
// edit_unapplied_rubric_comments capability, RubricComment.isApplied, and the student view.
import { test, expect, type APIRequestContext } from '@playwright/test';
import { apiAs, seedRubricData, setGraderRubricEditing, type SeedInfo } from './helpers';

test.use({ storageState: { cookies: [], origins: [] } });

let seed: SeedInfo;
let admin: APIRequestContext;
let grader: APIRequestContext;
let rubricEditor: APIRequestContext;
let student: APIRequestContext;

interface RC {
  id: number;
  text: string;
  category: number;
  isApplied: boolean | null;
}
async function rubricOf(api: APIRequestContext, assignmentId: number) {
  const res = await api.get(`/assignments/${assignmentId}/rubric/`);
  expect(res.ok(), await res.text()).toBeTruthy();
  return (await res.json()) as { rubricCategories: { id: number }[]; rubricComments: RC[] };
}
const byText = (rubric: { rubricComments: RC[] }, text: string) => rubric.rubricComments.find((c) => c.text === text)!;

async function capabilities(api: APIRequestContext) {
  const res = await api.get(`/courses/${seed.courseId}/capabilities/`);
  expect(res.ok(), await res.text()).toBeTruthy();
  return (await res.json()).capabilitiesMap as Record<string, boolean>;
}

test.beforeAll(async () => {
  seed = seedRubricData();
  admin = await apiAs('course_admin');
  grader = await apiAs('grader_basic');
  rubricEditor = await apiAs('grader_rubric');
  student = await apiAs('student');
});
test.afterAll(async () => {
  await setGraderRubricEditing(seed.courseId, true);
  await Promise.all([admin, grader, rubricEditor, student].map((a) => a.dispose()));
});

test.describe('setting OFF', () => {
  test.beforeAll(async () => setGraderRubricEditing(seed.courseId, false));

  test('a grader gets no rubric-editing capability and cannot add a rubric comment', async () => {
    const caps = await capabilities(grader);
    expect(caps.edit_unapplied_rubric_comments).toBe(false);
    expect(caps.edit_rubric).toBe(false);

    const rubric = await rubricOf(admin, seed.standard);
    const res = await grader.post('/rubricComments/', {
      data: { text: 'RB sneaky', pointDelta: -1, category: rubric.rubricCategories[0].id },
    });
    expect(res.status()).toBe(403);
    const after = await rubricOf(admin, seed.standard);
    expect(after.rubricComments.map((c) => c.text)).not.toContain('RB sneaky');
  });

  test('a grader cannot edit an unapplied rubric comment either', async () => {
    const rubric = await rubricOf(admin, seed.standard);
    const res = await grader.patch(`/rubricComments/${byText(rubric, 'RB unapplied criterion').id}/`, {
      data: { text: 'RB hijacked' },
    });
    expect(res.status()).toBe(403);
  });
});

test.describe('setting ON', () => {
  test.beforeAll(async () => setGraderRubricEditing(seed.courseId, true));

  test('capability follows the course setting; the rubric editor keeps full edit_rubric', async () => {
    const caps = await capabilities(grader);
    expect(caps.edit_unapplied_rubric_comments).toBe(true);
    expect(caps.edit_rubric).toBe(false);
    expect((await capabilities(rubricEditor)).edit_rubric).toBe(true);
    expect((await capabilities(admin)).edit_rubric).toBe(true);
  });

  test('a grader adds a comment and edits it, but never deletes and never touches categories', async () => {
    const rubric = await rubricOf(admin, seed.standard);
    const categoryId = rubric.rubricCategories[0].id;

    const created = await grader.post('/rubricComments/', {
      data: { text: 'RB grader-added', pointDelta: -2, category: categoryId },
    });
    expect(created.status(), await created.text()).toBe(201);
    const newId = (await created.json()).id as number;

    const edited = await grader.patch(`/rubricComments/${newId}/`, { data: { text: 'RB grader-edited', pointDelta: -4 } });
    expect(edited.status(), await edited.text()).toBe(200);
    expect((await edited.json()).text).toBe('RB grader-edited');
    expect(
      (await grader.put(`/rubricComments/${newId}/`, { data: { text: 'RB grader-put', pointDelta: -4, category: categoryId } })).status(),
    ).toBe(200);

    expect((await grader.delete(`/rubricComments/${newId}/`)).status()).toBe(403);

    // Category writes are the rubric editor's, even with the setting on.
    expect((await grader.patch(`/rubricCategories/${categoryId}/`, { data: { name: 'RB renamed' } })).status()).toBe(403);
    expect((await grader.delete(`/rubricCategories/${categoryId}/`)).status()).toBe(403);
    expect(
      (await grader.post('/rubricCategories/', { data: { name: 'RB new cat', assignment: seed.standard } })).status(),
    ).toBe(403);

    // Clean up with the admin, who may delete.
    expect((await admin.delete(`/rubricComments/${newId}/`)).status()).toBe(204);
  });

  test('an applied rubric comment is read-only for a grader (edit and delete refused, nothing changed)', async () => {
    const rubric = await rubricOf(admin, seed.standard);
    const applied = byText(rubric, 'RB applied criterion');
    expect(applied.isApplied).toBe(true);
    expect(byText(rubric, 'RB unapplied criterion').isApplied).toBe(false);

    expect((await grader.patch(`/rubricComments/${applied.id}/`, { data: { text: 'RB tampered' } })).status()).toBe(403);
    expect((await grader.put(`/rubricComments/${applied.id}/`, { data: { text: 'RB tampered', pointDelta: -5, category: applied.category } })).status()).toBe(403);
    expect((await grader.delete(`/rubricComments/${applied.id}/`)).status()).toBe(403);
    expect(byText(await rubricOf(admin, seed.standard), 'RB applied criterion').text).toBe('RB applied criterion');
  });

  test('the rubric editor and the course admin may still delete and edit categories', async () => {
    const rubric = await rubricOf(admin, seed.standard);
    const categoryId = rubric.rubricCategories[0].id;
    for (const [who, label] of [
      [rubricEditor, 'rubric editor'],
      [admin, 'admin'],
    ] as const) {
      const made = await who.post('/rubricComments/', { data: { text: `RB ${label} temp`, pointDelta: -1, category: categoryId } });
      expect(made.status(), await made.text()).toBe(201);
      expect((await who.delete(`/rubricComments/${(await made.json()).id}/`)).status()).toBe(204);
      expect((await who.patch(`/rubricCategories/${categoryId}/`, { data: { helpText: `RB by ${label}` } })).status()).toBe(200);
    }
  });

  test('in a collaborative-rubric assignment a grader has full comment controls (delete a comment)', async () => {
    const rubric = await rubricOf(admin, seed.collab);
    const applied = byText(rubric, 'RB applied criterion');
    const res = await grader.patch(`/rubricComments/${applied.id}/`, { data: { text: 'RB collab edit' } });
    expect(res.status(), await res.text()).toBe(200);
    const created = await grader.post('/rubricComments/', {
      data: { text: 'RB collab temp', pointDelta: -1, category: rubric.rubricCategories[0].id },
    });
    expect(created.status()).toBe(201);
    expect((await grader.delete(`/rubricComments/${(await created.json()).id}/`)).status()).toBe(204);
  });
});

test.describe('students', () => {
  test('before feedback is released the student cannot read the rubric', async () => {
    const res = await student.get(`/assignments/${seed.standard}/rubric/`);
    expect(res.status()).toBe(403);
  });

  test('after release the student reads the rubric and isApplied is null on every comment', async () => {
    const asAdmin = await admin.patch(`/assignments/${seed.standard}/`, { data: { feedbackStatus: 'released' } });
    expect(asAdmin.ok(), await asAdmin.text()).toBeTruthy();

    const rubric = await rubricOf(student, seed.standard);
    expect(rubric.rubricComments.length).toBeGreaterThanOrEqual(2);
    for (const c of rubric.rubricComments) expect(c.isApplied, c.text).toBeNull();

    const adminView = await rubricOf(admin, seed.standard);
    const applied = byText(adminView, 'RB applied criterion');
    const single = await student.get(`/rubricComments/${applied.id}/`);
    expect(single.ok(), await single.text()).toBeTruthy();
    expect((await single.json()).isApplied).toBeNull();
    // while course staff see the real value
    expect((await (await grader.get(`/rubricComments/${applied.id}/`)).json()).isApplied).toBe(true);
  });
});
