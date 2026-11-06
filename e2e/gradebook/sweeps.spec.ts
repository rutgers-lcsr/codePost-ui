// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
//
// Scheduled sweeps and admin-request emails (hardening round 2, F10): the publish and
// feedback-release beat tasks claim each due row atomically, so running them twice fires each
// transition exactly once and writes exactly one audit event; drafts and archived courses never
// auto-publish; admin-request emails honour OVERRIDE_EMAIL.
import { expect, test } from '@playwright/test';
import { API_URL } from '../constants';
import { auditEvents, auth, seedGradebook, shellJson, type Seed } from './helpers';

test.describe.configure({ mode: 'serial' });

let seed: Seed;
test.beforeAll(() => {
  seed = seedGradebook();
});

const runSweeps = () =>
  shellJson<{ publish: number[]; release: number[] }>(`
import json
from core.tasks import run_scheduled_assignment_publish, run_scheduled_feedback_release
publish = [run_scheduled_assignment_publish(), run_scheduled_assignment_publish()]
release = [run_scheduled_feedback_release(), run_scheduled_feedback_release()]
print('RESULT ' + json.dumps({'publish': publish, 'release': release}))
`);

test('a due scheduled publish and feedback release fire exactly once, however often the sweep runs', async ({
  request,
}) => {
  // A draft and an archived course's assignment with a due publishAt must never auto-publish.
  shellJson(`
import json
from datetime import timedelta
from django.utils import timezone
from core.models import Assignment, Course
past = timezone.now() - timedelta(hours=2)
sched = Course.objects.get(pk=${seed.courses.sched})
Assignment.objects.filter(course=sched, name__startswith='Never').delete()
Assignment.objects.create(course=sched, name='Never Draft', points=5, state='draft', publishAt=past)
arch = Course.objects.get(pk=${seed.courses.archived})
Assignment.objects.filter(course=arch, name__startswith='Never').delete()
Assignment.objects.create(course=arch, name='Never Archived', points=5, state='preview', publishAt=past)
print('RESULT {}')
`);

  const first = await runSweeps();
  // Exactly the one due publish and the one due release across the two runs of each sweep.
  expect(first.publish[0] + first.publish[1]).toBe(1);
  expect(first.release[0] + first.release[1]).toBe(1);
  expect(first.publish[1]).toBe(0);
  expect(first.release[1]).toBe(0);

  const headers = auth(seed.tokens.course_admin);
  const pub = await (await request.get(`${API_URL}/assignments/${seed.assignments.pub}/`, { headers })).json();
  expect(pub.state).toBe('published');
  const rel = await (await request.get(`${API_URL}/assignments/${seed.assignments.rel}/`, { headers })).json();
  expect(rel.feedbackStatus).toBe('released');

  const published = await auditEvents(
    request, seed.tokens.course_admin, seed.courses.sched, 'assignment_state_changed', seed.assignments.pub);
  expect(published).toHaveLength(1);
  const released = await auditEvents(
    request, seed.tokens.course_admin, seed.courses.sched, 'assignment_feedback_changed', seed.assignments.rel);
  expect(released).toHaveLength(1);

  // A third and fourth run still changes nothing.
  const again = await runSweeps();
  expect(again.publish).toEqual([0, 0]);
  expect(again.release).toEqual([0, 0]);

  const states = shellJson<Record<string, string>>(`
import json
from core.models import Assignment
print('RESULT ' + json.dumps({a.name: a.state for a in Assignment.objects.filter(name__startswith='Never')}))
`);
  expect(states).toEqual({ 'Never Draft': 'draft', 'Never Archived': 'preview' });
});

test('admin-request emails go only to OVERRIDE_EMAIL when it is set', () => {
  const sent = shellJson<{ to: string[][] }>(`
import json
from unittest import mock
from django.core.mail import EmailMessage
from django.contrib.auth.models import User
import core.emails as emails
user = User.objects.get(username='gb_orgstaff_own@dev.edu')
emails.TESTING = False
emails.OVERRIDE_EMAIL = 'sink@example.com'
to = []
with mock.patch.object(EmailMessage, 'send', lambda self, *a, **k: to.append(list(self.to)) or 1):
    emails.NewAdminRequestEmail(user).send_email('Some Org')
    emails.CodepostAPIErrorEmail(user).send_email('boom', 'details')
print('RESULT ' + json.dumps({'to': to}))
`);
  expect(sent.to.length).toBeGreaterThan(0);
  for (const recipients of sent.to) expect(recipients).toEqual(['sink@example.com']);
});
