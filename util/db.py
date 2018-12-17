from django.contrib.auth.models import User
from core.models import Profile
from core.models import Organization, Course
from core.models import Section, Assignment
from core.models import Submission, File, Comment
from core.models import RubricCategory, RubricComment
import random

## Create an organization, course, and assignment
princeton = Organization.objects.create(name="Princeton University", shortname="Princeton")
cos126s2019 = Course.objects.create(organization=princeton, period="S2019", name="COS126")
hellos2019 = Assignment.objects.create(course=cos126s2019, points=20, isReleased=True, name="Hello")

assignments = []
loopss2019 = Assignment.objects.create(course=cos126s2019, points=20, isReleased=True, name="loops")
assignments.append(loopss2019)
nbodys2019 = Assignment.objects.create(course=cos126s2019, points=20, isReleased=True, name="nbody")
assignments.append(nbodys2019)
sierpinskis2019 = Assignment.objects.create(course=cos126s2019, points=20, isReleased=True, name="sierpinski")
assignments.append(sierpinskis2019)
hammings2019 = Assignment.objects.create(course=cos126s2019, points=20, isReleased=True, name="hamming")
assignments.append(hammings2019)
lfsrs2019 = Assignment.objects.create(course=cos126s2019, points=20, isReleased=True, name="lfsr")
assignments.append(lfsrs2019)
guitars2019 = Assignment.objects.create(course=cos126s2019, points=20, isReleased=True, name="guitar")
assignments.append(guitars2019)
markovs2019 = Assignment.objects.create(course=cos126s2019, points=20, isReleased=True, name="markov")
assignments.append(markovs2019)

## Create some superusers
james = User.objects.create(username='james.alb.evans@gmail.com', email='james.alb.evans@gmail.com', password="rootabega")
richard = User.objects.create(username='rjfreling@gmail.com', email='rjfreling@gmail.com', password="rootabega")
vinay = User.objects.create(username='vayyala@gmail.com', email='vayyala@gmail.com', password="rootabega")
james.set_password("rootabega")
richard.set_password("rootabega")
vinay.set_password("rootabega")
james.is_superuser = True
james.is_staff = True
james.save()
richard.is_superuser = True
richard.is_staff = True
richard.save()
vinay.is_superuser = True
vinay.is_staff = True
vinay.save()

## Add some graders to the course
cos126s2019.graders.add(richard)
cos126s2019.graders.add(vinay)
cos126s2019.save()

## Add some courseadmins to the course
cos126s2019.courseAdmins.add(james)
cos126s2019.courseAdmins.add(vinay)
cos126s2019.save()

## Create some students and add them to the course
for i in range(0, 50):
  username = "user" + str(i) + "@gmail.com"
  tmpUser = User.objects.create(username=username, email=username, password="rootabega")
  tmpUser.profile.organization = princeton
  tmpUser.set_password("rootabega")
  cos126s2019.students.add(tmpUser)
  tmpUser.save()
  cos126s2019.save()
  for assn in assignments:
      sub = Submission.objects.create(assignment=assn)
      sub.students.add(tmpUser)
      code = "System.out.println('hello world, my name is " + username + "!')"
      tmpFile = File.objects.create(name="hello.java", code=code, submission=sub, extension='java')
      Comment.objects.create(text="good job, " + username, author=vinay, file=tmpFile, startChar=1, endChar=4, startLine=1, endLine=1)
      sub.isFinalized = True
      sub.grade = random.randint(0,20)
      if (i % 2 == 0):
          sub.grader = richard
      else:
          sub.grader = vinay
      sub.save()

  rubricCategory = RubricCategory.objects.create(assignment=hellos2019,name="General",pointLimit=10)
  rubricComment1 = RubricComment.objects.create(text='Missing a semicolon', pointDelta=2, category=rubricCategory)
  rubricComment2 = RubricComment.objects.create(text='Need more comments', pointDelta=3, category=rubricCategory)

  rubricCategory2 = RubricCategory.objects.create(assignment=hellos2019,name="Algorithms",pointLimit=20)
  rubricComment1 = RubricComment.objects.create(text='Nested loopkl jasldfkjlksa jlkfasdj flkjdklsjfklasjflk asj dfjklasjdflkkas jklfasj flkdj lsajf sjfdlkaj skldf', pointDelta=2, category=rubricCategory2)
  rubricComment2 = RubricComment.objects.create(text='n! complexity\nalskdfj ls\nlskdjf lasf\n', pointDelta=3, category=rubricCategory2)

users = User.objects.all()
for user in users:
  user.profile.organization = princeton
  user.save()
