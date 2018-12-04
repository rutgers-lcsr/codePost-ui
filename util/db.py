from django.contrib.auth.models import User
from core.models import Profile, Student, Grader, CourseAdmin
from core.models import Organization, CourseParent, Course
from core.models import Section, AssignmentParent, Assignment
from core.models import Submission, File, Comment
from core.models import RubricCategory, RubricComment


## Create an organization, a course parent, and a course
princeton = Organization.objects.create(name="Princeton University", shortname="Princeton")
cos126 = CourseParent.objects.create(name='COS126', org=princeton)
cos126s2019 = Course.objects.create(parent=cos126, period="S2019")

## Create an assignment parent and an assignment
hello = AssignmentParent.objects.create(name="Hello World", org=princeton)
hellos2019 = Assignment.objects.create(parent=hello, course=cos126s2019, points=20, isReleased=True)

rubricCategory = RubricCategory.objects.create(assignment=hellos2019,name="General",pointLimit=10)
rubricComment1 = RubricComment.objects.create(text='Missing a semicolon', pointDelta=2, category=rubricCategory)
rubricComment2 = RubricComment.objects.create(text='Need more comments', pointDelta=3, category=rubricCategory)

rubricCategory2 = RubricCategory.objects.create(assignment=hellos2019,name="Algorithms",pointLimit=20)
rubricComment1 = RubricComment.objects.create(text='Nested loopkl jasldfkjlksa jlkfasdj flkjdklsjfklasjflk asj dfjklasjdflkkas jklfasj flkdj lsajf sjfdlkaj skldf', pointDelta=2, category=rubricCategory2)
rubricComment2 = RubricComment.objects.create(text='n! complexity\nalskdfj ls\nlskdjf lasf\n', pointDelta=3, category=rubricCategory2)


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

code = """public class BinaryConverter {
public static void main(String[] args){
for(int i = -5; i < 33; i++){
System.out.println(i + ": " + toBinary(i));
System.out.println(i);
//always another way
System.out.println(i + ": " + Integer.toBinaryString(i));
}
}
/*
* pre: none
* post: returns a String with base10Num in base 2
*/
public static String toBinary(int base10Num){
boolean isNeg = base10Num < 0;
base10Num = Math.abs(base10Num);
String result = "";

while(base10Num > 1){
result = (base10Num % 2) + result;
base10Num /= 2;
}
assert base10Num == 0 || base10Num == 1 : "value is not <= 1: " + base10Num;

result = base10Num + result;
assert all0sAnd1s(result);

if( isNeg )
result = "-" + result;
return result;
}
/*
* pre: cal != null
* post: return true if val consists only of characters 1 and 0, false otherwise
*/
public static boolean all0sAnd1s(String val){
assert val != null : "Failed precondition all0sAnd1s. parameter cannot be null";
boolean all = true;
int i = 0;
char c;

while(all && i < val.length()){
c = val.charAt(i);
all = c == '0' || c == '1';
i++;
}
return all;
}
} """

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
  # code = "System.out.println('hello world, my name is " + username + "!')\nSierpinski's triangle .print()\n"
  tmpFile = File.objects.create(name="hello.java", code=code, submission=sub, extension='java')
  # Comment.objects.create(text="good job, " + username, author=vinay.profile.grader, file=tmpFile, startChar=1, endChar=4, startLine=1, endLine=1, pointDelta=1.0, localId=i)
  Comment.objects.create(text="good job, " + username, author=vinay.profile.grader, file=tmpFile, startChar=1, endChar=8, startLine=1, endLine=1, pointDelta=3, localId=i+1)
  Comment.objects.create(text="this is so terrible. also a really realy reallly long comment. that keeps going on and on without line breaks.", author=vinay.profile.grader, file=tmpFile, startChar=4, endChar=10, startLine=2, endLine=2, localId=i+2)
  Comment.objects.create(text="this is even worse", author=vinay.profile.grader, file=tmpFile, startChar=4, endChar=10, startLine=13, endLine=13, pointDelta=2, localId=i+3)
  sub.isFinalized = True
  sub.grader = richard.profile.grader
  sub.grade = 20
  sub.save()


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
Comment.objects.create(text="good job, " + username, author=vinay.profile.grader, file=tmpFile, startChar=1, endChar=8, startLine=1, endLine=1, pointDelta=3)
Comment.objects.create(text="this is so terrible. also a really realy reallly long comment. that keeps going on and on without line breaks.", author=vinay.profile.grader, file=tmpFile, startChar=4, endChar=10, startLine=2, endLine=2)
Comment.objects.create(text="this is even worse", author=vinay.profile.grader, file=tmpFile, startChar=4, endChar=10, startLine=13, endLine=13, pointDelta=2)
sub.isFinalized = True
sub.grade = 20
sub.save()
