# Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
#
# Seed for e2e/gradebook (run through `manage.py shell < seed_gradebook.py`, DEBUG=TRUE, throwaway DB).
# Idempotent: every "GB " course is deleted and rebuilt. Prints one line `SEED_JSON {...}`.
#
#   GB Grades   - Lab 1 (finalized grades 2,4,6,10 + a finalized NULL grade + students with several
#                 attempts, one with a dated and a NULL-dated submission), Lab 2 (late submissions and
#                 a resubmitter), Lab 3 (a negative grade).
#   GB Archived - archived course with an assignment, submission and rubric.
#   GB Target   - active course (same admin): clone destination.
#   GB Other    - another course with its own admin.
#   GB Sched    - assignments whose publishAt / releaseFeedbackAt are already due.
import json
from datetime import timedelta
from decimal import Decimal

from django.contrib.auth.models import User
from django.utils import timezone

from core.models import Assignment, Course, Organization, RubricCategory, RubricComment, Submission
from core.views.auth import tokens_for_user

now = timezone.now()
DUE = now - timedelta(days=10)

dev = Organization.objects.get(shortname='DEVORG')
other_org, _ = Organization.objects.get_or_create(
    shortname='GBOTHER', defaults=dict(name='GB Other Org', email_domain='gbother.edu'))


def user(email, org=dev, **profile):
    u, _ = User.objects.get_or_create(username=email, defaults=dict(email=email))
    u.profile.organization = org
    for key, value in profile.items():
        setattr(u.profile, key, value)
    u.profile.save()
    return u


admin = User.objects.get(username='course_admin_only')
grader = User.objects.get(username='grader_basic')
superuser = User.objects.filter(is_superuser=True).first()
other_admin = user('gb_other_admin@dev.edu', canModifyRosters=True, canCreateCourses=True)
orgstaff_own = user('gb_orgstaff_own@dev.edu', isOrgStaff=True, canModifyRosters=True)
orgstaff_foreign = user('gb_orgstaff_foreign@gbother.edu', org=other_org, isOrgStaff=True,
                        canModifyRosters=True)
students = [user(f'gb_s{i}@dev.edu') for i in range(1, 9)]
extra_student = user('gb_new_student@dev.edu')

Course.objects.filter(name__startswith='GB ').delete()


def course(name, admins, **kw):
    c = Course.objects.create(name=name, period='Fall 2026', organization=dev, **kw)
    c.courseAdmins.set(admins)
    return c


def assignment(c, name, points, **kw):
    kw.setdefault('state', 'published')
    kw.setdefault('uploadDueDate', DUE)
    return Assignment.objects.create(course=c, name=name, points=points, **kw)


def sub(a, who, grade=None, final=False, uploaded=None, grader_user=None):
    s = Submission.objects.create(assignment=a)
    s.students.set(who)
    # QuerySet.update bypasses save() side effects (grade recomputation, signals).
    Submission.objects.filter(pk=s.pk).update(
        isFinalized=final, grade=grade, grader=grader_user if final else None, dateUploaded=uploaded)
    return s


g = course('GB Grades', [admin], lateDayCreditsAllowable=5, showStudentsStatistics=True)
g.students.set(students)
g.graders.set([grader, orgstaff_foreign, orgstaff_own])
s1, s2, s3, s4, s5, s6, s7, s8 = students
early = DUE - timedelta(hours=1)

lab1 = assignment(g, 'Lab 1', 10, feedbackStatus='released')
for who, grade in ((s1, 2), (s2, 4), (s3, 6), (s4, 10)):
    sub(lab1, [who], Decimal(grade), True, early, grader)
sub(lab1, [s5], None, True, early, grader)
sub(lab1, [s6], None, False, DUE - timedelta(days=1))
sub(lab1, [s6], None, False, None)
sub(lab1, [s7], None, False, DUE - timedelta(days=2))
sub(lab1, [s7], None, False, DUE - timedelta(days=1))
for k in range(3):
    sub(lab1, [s8], None, False, DUE - timedelta(days=3 - k))

lab2 = assignment(g, 'Lab 2', 10)
sub(lab2, [s1], None, False, DUE + timedelta(hours=30))
sub(lab2, [s2], None, False, DUE + timedelta(hours=30))
sub(lab2, [s2], None, False, DUE + timedelta(hours=100))
sub(lab2, [s2], Decimal(8), True, DUE + timedelta(hours=49), grader)
sub(lab2, [s3], None, False, DUE + timedelta(hours=1))
sub(lab2, [s4], None, False, DUE + timedelta(hours=24))

lab3 = assignment(g, 'Lab 3', 20)
for who, grade in ((s1, -5), (s2, 10), (s3, 20)):
    sub(lab3, [who], Decimal(grade), True, early, grader)

late_sub = Submission.objects.filter(assignment=lab2, students=s1).first()

arch = course('GB Archived', [admin])
arch.students.set([s1])
arch.graders.set([grader])
arch_a = assignment(arch, 'Archived Lab', 10)
arch_sub = sub(arch_a, [s1], Decimal(5), True, early, grader)
cat = RubricCategory.objects.create(assignment=arch_a, name='Style', sortKey=0)
comment = RubricComment.objects.create(category=cat, name='Nice', text='Nice', pointDelta=1, sortKey=0)
Course.objects.filter(pk=arch.pk).update(archived=True)

target = course('GB Target', [admin])
uiarch = course('GB UiArchive', [admin])
assignment(uiarch, 'UI Lab', 10)
other = course('GB Other', [other_admin])
other.students.set([extra_student])
other_a = assignment(other, 'Other Lab', 10)

sched = course('GB Sched', [admin])
sched.students.set([s1])
pub = assignment(sched, 'Due To Publish', 10, state='preview', publishAt=now - timedelta(hours=1))
rel = assignment(sched, 'Due To Release', 10, feedbackStatus='hidden',
                 releaseFeedbackAt=now - timedelta(hours=1))
Assignment.objects.filter(pk__in=[pub.pk, rel.pk]).update(
    scheduledPublishRanAt=None, scheduledFeedbackReleaseRanAt=None)

tokens = {u.email: tokens_for_user(u)[0] for u in (other_admin, orgstaff_own, orgstaff_foreign)}
tokens['course_admin'] = tokens_for_user(admin)[0]
tokens['superuser'] = tokens_for_user(superuser)[0]
tokens['student_s1'] = tokens_for_user(s1)[0]

print('SEED_JSON ' + json.dumps(dict(
    courses=dict(grades=g.id, archived=arch.id, target=target.id, other=other.id, sched=sched.id, uiarchive=uiarch.id),
    assignments=dict(lab1=lab1.id, lab2=lab2.id, lab3=lab3.id, archived=arch_a.id, other=other_a.id,
                     pub=pub.id, rel=rel.id),
    submissions=dict(archived=arch_sub.id, lateSub=late_sub.id),
    rubric=dict(category=cat.id, comment=comment.id),
    emails=dict(s1=s1.email, s2=s2.email, s3=s3.email, s4=s4.email, newStudent=extra_student.email,
                grader=grader.email, admin=admin.email, orgOwn=orgstaff_own.email,
                orgForeign=orgstaff_foreign.email, otherAdmin=other_admin.email),
    tokens=tokens,
)))
