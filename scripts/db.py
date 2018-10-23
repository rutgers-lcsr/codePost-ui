from django.contrib.auth.models import User
from core.models import Profile, Student, Grader, CourseAdmin
from core.models import Organization, CourseParent, Course
from core.models import Section, AssignmentParent, Assignment
from core.models import Submission, File, Comment


james = User.objects.create(username='james.alb.evans@gmail.com', email='james.alb.evans@gmail.com', password="rootabega")
richard = User.objects.create(username='rjfreling@gmail.com', email='rjfreling@gmail.com', password="rootabega")
vinay = User.objects.create(username='vayyala@gmail.com', email='vayyala@gmail.com', password="rootabega")

james.is_superuser = True
james.is_staff = True
james.save()
richard.is_superuser = True
richard.is_staff = True
richard.save()
vinay.is_superuser = True
vinay.is_staff = True
vinay.save()

princeton = Organization.objects.create(name="Princeton University", shortname="Princeton")
cos126 = CourseParent.objects.create(name='COS126', org=princeton)
cos126s2019 = Course.objects.create(parent=cos126, period="S2019")
cos126f2019 = Course.objects.create(parent=cos126, period="F2019")

cos226 = CourseParent.objects.create(name='COS226', org=princeton)
cos226s2020 = Course.objects.create(parent=cos226, period="S2020")

hello = AssignmentParent.objects.create(name="Hello World", org=princeton)
hellos2019 = Assignment.objects.create(parent=hello, course=cos126s2019, points=20)
hellof2019 = Assignment.objects.create(parent=hello, course=cos126f2019, points=20)

nbody = AssignmentParent.objects.create(name="NBody", org=princeton)
nbodys2019 = Assignment.objects.create(parent=nbody, course=cos126s2019, points=20)
nbodyf2019 = Assignment.objects.create(parent=nbody, course=cos126f2019, points=20)

percolation = AssignmentParent.objects.create(name="Percolation", org=princeton)
percolations2020 = Assignment.objects.create(parent=percolation, course=cos226s2020, points=20)

sub = Submission.objects.create(assignment=hellos2019)
sub.students.add(james.profile.student)
sub.grader = richard.profile.grader
sub.save()

f1 = File.objects.create(name="hello.java", code="System.out.println('hello world!')", submission=sub, extension='java')
comment = Comment.objects.create(text="good job!", pointDelta=0, author=richard.profile.grader, file=f1, startChar=1, endChar=3)

richard.profile.student.courses.set(Course.objects.all())
richard.set_password('pass')
richard.save()
