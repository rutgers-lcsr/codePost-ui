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
cos126f2019 = Course.objects.create(parent=cos126, period="F2019")

cos226 = CourseParent.objects.create(name='COS226', org=princeton)
cos226s2020 = Course.objects.create(parent=cos226, period="S2020")
hellof2019 = Assignment.objects.create(parent=hello, course=cos126f2019, points=20)

nbody = AssignmentParent.objects.create(name="NBody", org=princeton)
nbodys2019 = Assignment.objects.create(parent=nbody, course=cos126s2019, points=20)
nbodyf2019 = Assignment.objects.create(parent=nbody, course=cos126f2019, points=20)

percolation = AssignmentParent.objects.create(name="Percolation", org=princeton)
percolations2020 = Assignment.objects.create(parent=percolation, course=cos226s2020, points=20)


cos126s2019.students.add(richard.profile.student)
cos126f2019.students.add(richard.profile.student)
cos226s2020.students.add(richard.profile.student)


sub = Submission.objects.create(assignment=hellos2019)
sub.students.add(richard.profile.student)
# code = "System.out.println('hello world, my name is \nabcd abcd\nthereis more code here\n"
tmpFile = File.objects.create(name="hello.java", code=code, submission=sub, extension='java')
Comment.objects.create(text="good job, " + username, author=vinay.profile.grader, file=tmpFile, startChar=1, endChar=8, startLine=1, endLine=1, pointDelta=3, localId=1)
Comment.objects.create(text="this is so terrible. also a really realy reallly long comment. that keeps going on and on without line breaks.", author=vinay.profile.grader, file=tmpFile, startChar=4, endChar=10, startLine=2, endLine=2, localId=2)
Comment.objects.create(text="this is even worse", author=vinay.profile.grader, file=tmpFile, startChar=4, endChar=10, startLine=13, endLine=13, pointDelta=2, localId=3)
sub.isFinalized = True
sub.grade = 20
sub.save()