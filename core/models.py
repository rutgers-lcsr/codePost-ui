from django.db import models
from django.contrib.auth.models import User

############# User Section ####################################################

class Organization(models.Model):
	name = models.CharField(max_length=64)
	shortname = models.CharField(max_length=12)

class Profile(models.Model):
	user = models.OneToOneField(User, on_delete=models.CASCADE)
	org = models.ForeignKey(Organization, on_delete=models.CASCADE)

class StudentUser(models.Model):
	user = models.OneToOneField(User, on_delete=models.CASCADE)

class GraderUser(models.Model):
	user = models.OneToOneField(User, on_delete=models.CASCADE)

class AdminUser(models.Model):
	user = models.OneToOneField(User, on_delete=models.CASCADE)

###############################################################################


############# Course Infrastructure Section ####################################

class Course(models.Model):
	name = models.CharField(max_length=32)
	org = models.ForeignKey(Organization, on_delete=models.CASCADE)
	students = models.ManyToManyField(StudentUser)
	graders = models.ManyToManyField(GraderUser)
	admins = models.ManyToManyField(AdminUser)

class Section(models.Model):
	course = models.ForeignKey(Course, on_delete=models.CASCADE)
	students = models.ManyToManyField(StudentUser)

class Assignment(models.Model):
	name = models.CharField(max_length=32)
	course = models.ForeignKey(Course, on_delete=models.CASCADE)
	isReleased = models.BooleanField(default=False)

class RubricCategory(models.Model):
	assignment = models.ForeignKey(Assignment, on_delete=models.CASCADE)
	name = models.CharField(max_length=32)
	pointLimit = models.IntegerField()

class RubricComment(models.Model):
	text = models.TextField()
	deduction = models.IntegerField()
	category = models.ForeignKey(RubricCategory, on_delete=models.CASCADE)

###############################################################################


############# Submissions Section #############################################

class Submission(models.Model):
	assignment = models.ForeignKey(Assignment, on_delete=models.CASCADE)
	students = models.ManyToManyField(StudentUser)
	grader = models.ForeignKey(GraderUser, null=True, on_delete=models.SET_NULL)
	isFinalized = models.BooleanField()

class File(models.Model):
	name = models.CharField(max_length=32)
	code = models.TextField()
	submission = models.ForeignKey(Submission, on_delete=models.CASCADE)
	extension = models.CharField(max_length=8, null=True, blank=True)

class Comment(models.Model):
	text = models.TextField()
	deduction = models.IntegerField()
	rubricComment = models.ForeignKey(RubricComment, null=True, on_delete=models.SET_NULL)

#############################################################################$$