from django.contrib.auth.models import User
from core.models import Profile, Student, Grader, CourseAdmin
from core.models import Organization, CourseParent, Course
from core.models import Section, AssignmentParent, Assignment
from core.models import Submission, File, Comment


## Create an organization, a course parent, and a course
princeton = Organization.objects.create(name="Princeton University", shortname="Princeton")
cos126 = CourseParent.objects.create(name='COS126', org=princeton)
cos126s2019 = Course.objects.create(parent=cos126, period="S2019")

## Create an assignment parent and an assignment
hello = AssignmentParent.objects.create(name="Hello World", org=princeton)
hellos2019 = Assignment.objects.create(parent=hello, course=cos126s2019, points=20)

## Create some students and add them to the course
for i in range(0, 50):
  username = "user" + str(i) + "@gmail.com"
  tmpUser = User.objects.create(username=username, email=username, password="rootabega")
  tmpUser.profile.organization = princeton
  tmpUser.set_password("rootabega")
  cos126s2019.students.add(tmpUser.profile.student)
  tmpUser.save()
  cos126s2019.save()
  sub = Submission.objects.create(assignment=hellos2019)
  sub.students.add(tmpUser.profile.student)
  code = "System.out.println('hello world, my name is " + username + "!')"
  File.objects.create(name="hello.java", code=code, submission=sub, extension='java')

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
cos126s2019.graders.add(richard.profile.grader)
cos126s2019.graders.add(vinay.profile.grader)
cos126s2019.save()

## Add some courseadmins to the course
cos126s2019.courseAdmins.add(james.profile.courseadmin)
cos126s2019.save()

