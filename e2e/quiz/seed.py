# Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
#
# Seed for the quiz e2e area. Run through `manage.py shell` (stdin) by helpers.ts. Everything it
# creates is prefixed with $E2EQZ_PREFIX, and a run first deletes the previous data under that
# prefix, so it is idempotent. It prints one line `E2EQZ_JSON:{...}` with ids and student tokens.
import json
import os
from datetime import timedelta
from decimal import Decimal

from django.contrib.auth.models import User
from django.db.models.signals import post_save
from django.utils import timezone
from factory.django import mute_signals

from core.models import (
    Assignment, Course, Question, QuestionBank, Quiz, QuizQuestion, Submission, SubmissionFile,
)
from core.views.auth import tokens_for_user

PREFIX = os.environ['E2EQZ_PREFIX']
course = Course.objects.get(name='Demo Course', period='Spring 2026')
admin = User.objects.get(username='course_admin_only')
now = timezone.now()

# ---- clean previous data under this prefix ----
Quiz.objects.filter(course=course, title__startswith=PREFIX).delete()
QuestionBank.objects.filter(course=course, name__startswith=PREFIX).delete()
Assignment.objects.filter(course=course, name__startswith=PREFIX).delete()


def student(slug):
    email = f'{PREFIX.strip().lower()}_{slug}@dev.edu'
    user, created = User.objects.get_or_create(
        username=email, defaults={'email': email, 'first_name': 'E2E', 'last_name': slug})
    user.email = email
    user.save()
    course.students.add(user)
    return user


students = {slug: student(slug) for slug in os.environ.get('E2EQZ_STUDENTS', 's1,s2').split(',')}

bank = QuestionBank.objects.create(course=course, name=PREFIX + 'bank', createdBy=admin)
question = Question.objects.create(course=course, bank=bank, questionType='short_answer',
                                   text='Capital of France?', points=Decimal('2'), createdBy=admin)
question.choices.create(text='Paris', isCorrect=True, sortKey=0)


def assignment(name, due=None):
    a = Assignment.objects.create(course=course, name=PREFIX + name, explanation='e2e', points=100,
                                  state='published', allowStudentUpload=True)
    if due is not None:
        a.uploadDueDate = due
        a.save()
    return a


def quiz(title, assignment=None, **kw):
    q = Quiz.objects.create(course=course, title=PREFIX + title, createdBy=admin, isPublished=True,
                            assignment=assignment, **kw)
    QuizQuestion.objects.create(quiz=q, question=question, sortKey=0)
    return q


def submission(a, *users, files=()):
    with mute_signals(post_save):
        s = Submission.objects.create(assignment=a, dateUploaded=timezone.now())
        s.students.add(*users)
        for name, data in files:
            SubmissionFile.objects.create(submission=s, name=name, extension='.txt', data=data,
                                          path='', hiddenBeforePublish=True)
    return s


scenario = os.environ['E2EQZ_SCENARIO']
out = {}
day = timedelta(days=1)

if scenario == 'boundary':
    out['standalone'] = quiz('standalone', endAttemptsAtClose=True, availableUntil=now + day).id
    a_due = assignment('due', due=now + day)
    out['assignmentDue'] = a_due.id
    out['quizDue'] = quiz('during-due', a_due, assignmentTrigger='during', closeEvent='assignment_due',
                          endAttemptsAtClose=True).id
    a_sub = assignment('sub', due=now + day)
    out['assignmentSub'] = a_sub.id
    out['quizSub'] = quiz('during-sub', a_sub, assignmentTrigger='during', closeEvent='submission',
                          endAttemptsAtClose=True).id
elif scenario == 'uniqueness':
    a1, a2 = assignment('A1'), assignment('A2')
    out['assignment1'], out['assignment2'] = a1.id, a2.id
    out['sub1'] = submission(a1, students['s1']).id
    out['sub2'] = submission(a1, students['s2']).id
    out['sub3'] = submission(a2, students['s1']).id
elif scenario == 'dump':
    a = assignment('dump')
    out['sub'] = submission(a, students['s1'], files=[('_tests.txt', 'E2E-DUMP-LOG-LINE')]).id
elif scenario == 'code':
    q = Quiz.objects.create(course=course, title=PREFIX + 'code', createdBy=admin, isPublished=True, attemptsAllowed=0)
    for i, (lang, text) in enumerate([('Python 3.12', 'Print 42'), ('Brainfuck', 'Unsupported language')]):
        cq = Question.objects.create(course=course, bank=bank, questionType='code', language=lang, text=text,
                                     points=Decimal('5'), createdBy=admin)
        QuizQuestion.objects.create(quiz=q, question=cq, sortKey=i)
    out['quiz'] = q.id
elif scenario == 'grading':
    Course.objects.filter(id=course.id).update(gradersCanGradeQuizzes=True)
    q = Quiz.objects.create(course=course, title=PREFIX + 'essay', createdBy=admin, isPublished=True, attemptsAllowed=0)
    essay = Question.objects.create(course=course, bank=bank, questionType='essay', text='Explain.',
                                    points=Decimal('5'), createdBy=admin)
    QuizQuestion.objects.create(quiz=q, question=essay, sortKey=0)
    qg_email = PREFIX.strip().lower() + '_quizgrader@dev.edu'
    qg, _ = User.objects.get_or_create(username=qg_email, defaults={'email': qg_email})
    course.graders.add(qg)
    course.quizGraders.add(qg)
    out['quiz'] = q.id
    extra_tokens = {'quizGrader': tokens_for_user(qg)[0]}
elif scenario == 'email':
    dup = 'dup_' + PREFIX.strip().lower() + '@dev.edu'
    # Two accounts share an email; only the second is in the course.
    outsider, _ = User.objects.get_or_create(username=dup + '.outsider', defaults={'email': dup})
    member, _ = User.objects.get_or_create(username=dup + '.member', defaults={'email': dup})
    for u in (outsider, member):
        u.email = dup
        u.save()
    course.students.add(member)
    a = assignment('email')
    out.update(dupEmail=dup, assignment=a.id)

out['course'] = course.id
out['graderEmail'] = course.graders.first().email
out['tokens'] = {slug: tokens_for_user(u)[0] for slug, u in students.items()}
out['tokens'].update(globals().get('extra_tokens', {}))
out['students'] = {slug: u.email for slug, u in students.items()}
print('E2EQZ_JSON:' + json.dumps(out))
