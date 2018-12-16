from django.contrib.auth.models import User
from core.models import Profile
from core.models import Organization, Course
from core.models import Section, Assignment
from core.models import Submission, File, Comment

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


cos126s2019.students.add(richard)
cos126f2019.students.add(richard)
cos226s2020.students.add(richard)

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


sub = Submission.objects.create(assignment=hellos2019)
sub.students.add(richard)
# code = "System.out.println('hello world, my name is \nabcd abcd\nthereis more code here\n"
tmpFile = File.objects.create(name="hello.java", code=code, submission=sub, extension='java')
Comment.objects.create(text="good job, " + username, author=vinay, file=tmpFile, startChar=1, endChar=8, startLine=1, endLine=1, pointDelta=3)
Comment.objects.create(text="this is so terrible. also a really realy reallly long comment. that keeps going on and on without line breaks.", author=vinay, file=tmpFile, startChar=4, endChar=10, startLine=2, endLine=2)
Comment.objects.create(text="this is even worse", author=vinay, file=tmpFile, startChar=4, endChar=10, startLine=13, endLine=13, pointDelta=2)
sub.isFinalized = True
sub.grade = 20
sub.save()
