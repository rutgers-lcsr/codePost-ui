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
  organization = models.ForeignKey(Organization, on_delete=models.CASCADE, blank=True, null=True)

  def __str__(self):
    return self.user.email

class Course(models.Model):
  name = models.CharField(max_length=16)
  organization = models.ForeignKey(Organization, on_delete=models.CASCADE, related_name="courses")
  period = models.CharField(max_length=32)
  students = models.ManyToManyField(User, related_name="student_courses")
  inactive_students = models.ManyToManyField(User, related_name="inactive_student_courses")
  graders = models.ManyToManyField(User, related_name="grader_courses")
  courseAdmins = models.ManyToManyField(User, related_name="courseAdmin_courses")

  class Meta:
    unique_together = ('name', 'organization')

  def __str__(self):
    return str(self.name) + " | " + self.period

################################################################################

############# Course Infrastructure Section ####################################

class Section(models.Model):
  name = models.CharField(max_length=16)
  course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='sections')
  leaders = models.ManyToManyField(User, blank=True, related_name='leader_sections')
  students = models.ManyToManyField(User, related_name='student_sections')

  class Meta:
    unique_together = ('name', 'course')

  def __str__(self):
    return self.name + " | " + str(self.course)

class Assignment(models.Model):
  course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='assignments')
  name = models.CharField(max_length=16)
  isReleased = models.BooleanField(default=False)
  points = models.IntegerField()

  def __str__(self):
    return str(self.name) + " | " + str(self.course)

  class Meta:
    unique_together = ('name', 'course')

class RubricCategory(models.Model):
  assignment = models.ForeignKey(Assignment, on_delete=models.CASCADE, related_name="rubricCategories")
  name = models.CharField(max_length=32)
  pointLimit = models.IntegerField()

  class Meta:
    unique_together = ('name', 'assignment')

class RubricComment(models.Model):
  text = models.TextField()
  pointDelta = models.FloatField()
  category = models.ForeignKey(RubricCategory, on_delete=models.CASCADE, related_name="rubricComments")

###############################################################################


############# Submissions Section #############################################

class Submission(models.Model):
  assignment = models.ForeignKey(Assignment, on_delete=models.CASCADE, related_name="submissions")
  students = models.ManyToManyField(User, related_name="student_submissions")
  grader = models.ForeignKey(User, blank=True, null=True, on_delete=models.SET_NULL, related_name="grader_submissions")
  isFinalized = models.BooleanField(default=False)
  dateFinalized = models.DateTimeField(blank=True, null=True)
  grade = models.FloatField(null=True, blank=True) # this is just a cache. Should we get rid of this?

class File(models.Model):
  name = models.CharField(max_length=32)
  code = models.TextField()
  submission = models.ForeignKey(Submission, on_delete=models.CASCADE, related_name="files")
  extension = models.CharField(max_length=8, null=True, blank=True)

  class Meta:
    unique_together = ('name', 'submission')

class Comment(models.Model):
  text = models.TextField()
  pointDelta = models.FloatField(blank=True, null=True)
  rubricComment = models.ForeignKey(RubricComment, null=True, blank=True, on_delete=models.SET_NULL, related_name="comments")
  author = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
  file = models.ForeignKey(File, on_delete=models.CASCADE, related_name ="comments")
  startChar = models.IntegerField()
  endChar = models.IntegerField()
  startLine = models.IntegerField()
  endLine = models.IntegerField()
  localId = models.FloatField(blank=True, null=True)

###############################################################################

############# Signals #########################################################

@receiver(post_save, sender=User)
def create_user_profile(sender, instance, created, **kwargs):
  if created:
    # need to set organization here too, somehow
    profile = Profile.objects.create(user=instance)

# Throws RelatedObjectDoesNotExist Exceptions
# Temp fix --> hasattr(instance.profile, 'student')
# Could also do try: catch:
# Or restructure models
@receiver(post_save, sender=User)
def save_user_profile(sender, instance, **kwargs):
  instance.profile.save()

