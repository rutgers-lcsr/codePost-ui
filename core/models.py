from django.db import models
from django.contrib.auth.models import User
from django.db.models.signals import post_save
from django.dispatch import receiver

# Notes
# Consider using indexes (db_index) to speed up common queries
# (https://stackoverflow.com/questions/14786413/add-indexes-db-index-true)

############# User Section ####################################################

class Organization(models.Model):
  name = models.CharField(max_length=64, unique=True)
  shortname = models.CharField(max_length=12, unique=True)

  class Meta:
    ordering = ('name',)

  def __str__(self):
    return self.shortname

# https://wsvincent.com/django-custom-user-model-tutorial/
class Profile(models.Model):
  user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="profile")
  org = models.ForeignKey(Organization, on_delete=models.CASCADE, blank=True, null=True)

  def __str__(self):
    return self.user.username

class Student(models.Model):
  profile = models.OneToOneField(Profile, on_delete=models.CASCADE, related_name="student")

  def __str__(self):
    return self.profile.user.username

class Grader(models.Model):
  profile = models.OneToOneField(Profile, on_delete=models.CASCADE, related_name="grader")

  def __str__(self):
    return self.profile.user.username

class CourseAdmin(models.Model):
  profile = models.OneToOneField(Profile, on_delete=models.CASCADE, related_name="courseadmin")

  def __str__(self):
    return self.profile.user.username

class CourseParent(models.Model):
  name = models.CharField(max_length=32)
  org = models.ForeignKey(Organization, on_delete=models.CASCADE)

  def __str__(self):
    return self.name + " | " + self.org.shortname

class Course(models.Model):
  parent = models.ForeignKey(CourseParent, on_delete=models.CASCADE)
  period = models.CharField(max_length=32)
  students = models.ManyToManyField(Student, related_name="courses")
  graders = models.ManyToManyField(Grader, related_name="courses")
  courseAdmins = models.ManyToManyField(CourseAdmin, related_name="courses")

  def __str__(self):
    return str(self.parent) + " | " + self.period

################################################################################

############# Course Infrastructure Section ####################################

class Section(models.Model):
  name = models.CharField(max_length=16)
  course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='sections')
  leader = models.ManyToManyField(Grader, blank=True, related_name='sections')
  students = models.ManyToManyField(Student)

  def __str__(self):
    return self.name + " | " + str(self.course)

class AssignmentParent(models.Model):
  name = models.CharField(max_length=32)
  org = models.ForeignKey(Organization, on_delete=models.CASCADE)

  def __str__(self):
    return self.name + " | " + str(self.org)

class Assignment(models.Model):
  parent = models.ForeignKey(AssignmentParent, on_delete=models.CASCADE)
  course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='assignments')
  isReleased = models.BooleanField(default=False)
  points = models.IntegerField()

  def __str__(self):
    return str(self.parent) + " | " + str(self.course)

class RubricCategory(models.Model):
  assignment = models.ForeignKey(Assignment, on_delete=models.CASCADE, related_name="rubricCategories")
  name = models.CharField(max_length=32)
  pointLimit = models.IntegerField()

  def __str__(self):
      return self.name + " | " + str(self.course)

class RubricComment(models.Model):
  text = models.TextField()
  pointDelta = models.FloatField()
  category = models.ForeignKey(RubricCategory, on_delete=models.CASCADE, related_name="rubricComments")

###############################################################################


############# Submissions Section #############################################

class Submission(models.Model):
  assignment = models.ForeignKey(Assignment, on_delete=models.CASCADE, related_name="submissions")
  students = models.ManyToManyField(Student, related_name="submissions")
  grader = models.ForeignKey(Grader, null=True, on_delete=models.SET_NULL, related_name="submissions")
  isFinalized = models.BooleanField(default=False)
  dateFinalized = models.DateTimeField(blank=True, null=True)
  grade = models.FloatField(null=True, blank=True)

class File(models.Model):
  name = models.CharField(max_length=32)
  code = models.TextField()
  submission = models.ForeignKey(Submission, on_delete=models.CASCADE, related_name="files")
  extension = models.CharField(max_length=8, null=True, blank=True)

class Comment(models.Model):
  text = models.TextField()
  pointDelta = models.FloatField(blank=True, null=True)
  rubricComment = models.ForeignKey(RubricComment, null=True, blank=True, on_delete=models.SET_NULL, related_name="comments")
  author = models.ForeignKey(Grader, on_delete=models.SET_NULL, null=True)
  file = models.ForeignKey(File, on_delete=models.CASCADE, related_name ="comments")
  startChar = models.IntegerField()
  endChar = models.IntegerField()
  startLine = models.IntegerField()
  endLine = models.IntegerField()

###############################################################################

############# Signals #########################################################

@receiver(post_save, sender=User)
def create_user_profile(sender, instance, created, **kwargs):
  if created:
    profile = Profile.objects.create(user=instance)
    Student.objects.create(profile=profile)
    Grader.objects.create(profile=profile)
    CourseAdmin.objects.create(profile=profile)

# Throws RelatedObjectDoesNotExist Exceptions
# Temp fix --> hasattr(instance.profile, 'student')
# Could also do try: catch:
# Or restructure models
@receiver(post_save, sender=User)
def save_user_profile(sender, instance, **kwargs):
  instance.profile.save()

  if hasattr(instance.profile, 'student'):
    instance.profile.student.save()
  if hasattr(instance.profile, 'grader'):
    instance.profile.grader.save()
  if hasattr(instance.profile, 'courseadmin'):
    instance.profile.courseadmin.save()
