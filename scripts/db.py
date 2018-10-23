from django.contrib.auth.models import User
from core.models import Profile, Student, Grader, CourseAdmin
from core.models import Organization, CourseParent, Course
from core.models import Section, AssignmentParent, Assignment
from core.models import Submission, File, Comment

## Create some users
james = User.objects.create(username='james.alb.evans@gmail.com', email='james.alb.evans@gmail.com', password="rootabega")
richard = User.objects.create(username='rjfreling@gmail.com', email='rjfreling@gmail.com', password="rootabega")
vinay = User.objects.create(username='vayyala@gmail.com', email='vayyala@gmail.com', password="rootabega")
simon = User.objects.create(username='simon@gmail.com', email='simon@gmail.com', password="rootabega")
sydney = User.objects.create(username='sydney@gmail.com', email='sydney@gmail.com', password="rootabega")

james.set_password("rootabega")
richard.set_password("rootabega")
vinay.set_password("rootabega")
simon.set_password("rootabega")
sydney.set_password("rootabega")

## Give coders superuser access
james.is_superuser = True
james.is_staff = True
james.save()
richard.is_superuser = True
richard.is_staff = True
richard.save()
vinay.is_superuser = True
vinay.is_staff = True
vinay.save()
simon.is_superuser = True
simon.is_staff = True
simon.save()
sydney.is_superuser = True
sydney.is_staff = True
sydney.save()

## Create an organization, a course parent, and a course
princeton = Organization.objects.create(name="Princeton University", shortname="Princeton")
cos126 = CourseParent.objects.create(name='COS126', org=princeton)
cos126s2019 = Course.objects.create(parent=cos126, period="S2019")

## Add some students to the course
cos126s2019.students.add(simon.profile.student)
cos126s2019.students.add(sydney.profile.student)
cos126s2019.save()

## Add some graders to the course
cos126s2019.graders.add(richard.profile.grader)
cos126s2019.graders.add(vinay.profile.grader)
cos126s2019.save()

## Add some courseadmins to the course
cos126s2019.courseAdmins.add(james.profile.courseadmin)
cos126s2019.save()

## Create an assignment parent and an assignment
hello = AssignmentParent.objects.create(name="Hello World", org=princeton)
hellos2019 = Assignment.objects.create(parent=hello, course=cos126s2019, points=20)

## Create simon's submission
sub = Submission.objects.create(assignment=hellos2019)
sub.students.add(simon.profile.student)
sub.save()
f1 = File.objects.create(name="hello.java", code="System.out.println('hello world!')", submission=sub, extension='java')

## Create sydney's submission
sub = Submission.objects.create(assignment=hellos2019)
sub.students.add(sydney.profile.student)
sub.save()
f2 = File.objects.create(name="hello.java", code="System.out.print('hello world!')", submission=sub, extension='java')

## Create two sections
section1 = Section.objects.create(name="P01", course=cos126s2019)
section1.students.add(simon.profile.student)
section1.save()

section2 = Section.objects.create(name="P02", course=cos126s2019)
section2.students.add(sydney.profile.student)
section2.save()

