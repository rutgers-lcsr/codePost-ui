from django.contrib.auth.models import User
from core.models import Profile
from core.models import Organization, Course
from core.models import Section, Assignment
from core.models import Submission, File, Comment
from core.models import RubricCategory, RubricComment

## Create an organization, course, and assignment
princeton = Organization.objects.create(name="Princeton University", shortname="Princeton")
cos126s2019 = Course.objects.create(organization=princeton, period="S2019", name="COS126")
hellos2019 = Assignment.objects.create(course=cos126s2019, points=20, isReleased=True, name="Hello")

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
  sub = Submission.objects.create(assignment=hellos2019)
  sub.students.add(tmpUser)
  code = "System.out.println('hello world, my name is " + username + "!')"
  tmpFile = File.objects.create(name="hello.java", code=code, submission=sub, extension='java')
  Comment.objects.create(text="good job, " + username, author=vinay, file=tmpFile, startChar=1, endChar=4, startLine=1, endLine=1)
  sub.isFinalized = True
  sub.grade = 20
  sub.save()

users = User.objects.all()
for user in users:
  user.profile.organization = princeton
  user.save()

## Add some extra objects
cos126f2019 = Course.objects.create(organization=princeton, period="F2019", name="COS126")
cos226s2020 = Course.objects.create(organization=princeton, period="S2020", name="COS226")
cos226s2020.courseAdmins.add(james)

hellof2019 = Assignment.objects.create(course=cos126f2019, points=20, name="Hello")
nbodys2019 = Assignment.objects.create(course=cos126s2019, points=20, name="NBody")
nbodyf2019 = Assignment.objects.create(course=cos126f2019, points=20, name="NBody")
percolations2020 = Assignment.objects.create(course=cos226s2020, points=20, name="Percolations")
