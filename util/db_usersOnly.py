from django.contrib.auth.models import User
from core.models import Profile
from core.models import Organization, Course
from core.models import Section, Assignment
from core.models import Submission, File, Comment

## Create an organization, course, and assignment
princeton = Organization.objects.create(name="Princeton University", shortname="Princeton")

## Create some superusers
adminuser = User.objects.create(username='admin@gmail.com', email='admin@gmail.com')
adminuser.profile.organization = princeton
adminuser.set_password('rootabega')
adminuser.save()

## Create some students and add them to the course
for i in range(0, 50):
  username = "user" + str(i) + "@gmail.com"
  tmpUser = User.objects.create(username=username, email=username, password="rootabega")
  tmpUser.profile.organization = princeton
  tmpUser.set_password("rootabega")
  tmpUser.save()

# Make adminuser a courseAdmin for COS101
cos101 = Course.objects.create(organization=princeton, period="Fall", name="COS101")
cos101.courseAdmins.add(adminuser)