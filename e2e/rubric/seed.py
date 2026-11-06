# Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
#
# Rubric e2e seed, piped into `manage.py shell` by helpers.ts. Idempotent: every "RB " assignment
# in the Demo Course is deleted and rebuilt, so each run starts from the same known state.
#   RB Standard : standard rubric (admin/rubric-editor only), one applied + one unapplied comment
#   RB Collab   : collaborativeRubricMode, same shape
#   RB Flow     : released-feedback-ready grading flow, one unclaimed submission, no applied comments
from decimal import Decimal
from django.contrib.auth.models import User
from django.utils import timezone
from core.models import (Assignment, Comment, Course, RubricCategory, RubricComment, Submission,
                         SubmissionFile)

course = Course.objects.get(name='Demo Course', period='Spring 2026')
org = course.organization
Assignment.objects.filter(course=course, name__startswith='RB ').delete()

def user(username):
    u, created = User.objects.get_or_create(
        username=username, defaults={'email': f'{username}@dev.edu', 'first_name': 'RB', 'last_name': username})
    u.profile.organization = org
    u.profile.save()
    return u

student = User.objects.get(username='student_only')
student2 = user('rb_student2')
course.students.add(student2)
course.allowGradersToEditRubric = True
course.save()
grader = User.objects.get(username='grader_basic')

def make(name, **extra):
    return Assignment.objects.create(course=course, name=name, points=Decimal('100'), sortKey=900,
                                     state='published', feedbackStatus='hidden', **extra)

def rubric(a, with_applied=True):
    cat = RubricCategory.objects.create(assignment=a, name='RB Correctness', sortKey=0)
    applied = RubricComment.objects.create(
        category=cat, text='RB applied criterion', pointDelta=Decimal('5'), sortKey=0,
        explanation='RB applied explanation', instructionText='RB applied instructions')
    unapplied = RubricComment.objects.create(
        category=cat, text='RB unapplied criterion', pointDelta=Decimal('3'), sortKey=1)
    return cat, applied, unapplied

def submit(a, who, graded_by, finalized, apply_rc=None):
    sub = Submission.objects.create(assignment=a, grader=graded_by, isFinalized=finalized,
                                    dateUploaded=timezone.now())
    sub.students.add(who)
    f = SubmissionFile.objects.create(submission=sub, name='hello.py', extension='.py',
                                      data='def hello():\n    return 1\n')
    if apply_rc is not None:
        Comment.objects.create(file=f, author=grader, text='applied in grading', startLine=0, endLine=0,
                               startChar=0, endChar=0, rubricComment=apply_rc)
    sub.save()
    return sub

a = make('RB Standard')
_, applied, _ = rubric(a)
standard_sub = submit(a, student, grader, True, applied)

c = make('RB Collab', collaborativeRubricMode=True)
_, applied, _ = rubric(c)
submit(c, student, grader, True, applied)

f = make('RB Flow')
rubric(f)
submit(f, student2, None, False)
# A grader of their own that the roster spec removes, assigned to a submission of RB Standard.
g2 = user('rb_grader2')
course.inactive_graders.remove(g2)
course.graders.add(g2)
sub_g2 = submit(a, student2, g2, False)

from core.views.auth import tokens_for_user
import json
access, _refresh = tokens_for_user(g2)
s2_access, _ = tokens_for_user(student2)
print('RB_SEED_OK', json.dumps({'standard': a.id, 'collab': c.id, 'flow': f.id, 'g2Submission': sub_g2.id, 'standardSub': standard_sub.id,
                                'g2Token': access, 's2Token': s2_access, 'courseId': course.id}))
