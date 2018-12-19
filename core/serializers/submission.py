from rest_framework import serializers
from core.serializers.template import ModelSerializerWithPOSTCheck
from core.models import Submission, User
from core.serializers.file import FileSerializer
from core.permissions.helpers import isStudent, isGrader

def formErrorMessage(message, users):
  toRet = message + ": "
  for user in users:
    toRet = toRet + user.email + ", "
  return toRet[:-2]

class SubmissionSerializer(ModelSerializerWithPOSTCheck):
  students = serializers.SlugRelatedField(many=True, slug_field='email', queryset=User.objects.all(), allow_null=True)
  grader = serializers.SlugRelatedField(many=False, slug_field='email', queryset=User.objects.all(), required=False, allow_null=True)

  class Meta:
    model = Submission
    fields = ('id', 'assignment', 'students', 'grader', 'isFinalized', 'dateFinalized', 'grade', 'files')
    POST_permissions_fields = ('assignment',)

  # We can't use validate_students, because we need information from the assignment (the course)
  # Note that we're not checking permissions here, though we could...
  # To consider: validate by request type here
  # Pros: more self-documenting (permissions sit with objects)
  def validate(self, data):
    newData = super().validate(data)

    # This code is a little shaky. One of these things should be true:
    # (1) Assignment, as a required field, is present in data. This situation occurs on object creation.
    # (2) Assignment is already specified, but potentially not present in data. This situation occurs on
    #     a partial update.
    if self.instance:
      assignment = self.instance.assignment
      students = self.instance.students.all()
      grader = self.instance.grader

    # If we are trying to overwrite assignment, we should use this value, not the old one
    if 'assignment' in newData:
      assignment = newData['assignment']
    if 'students' in newData:
      students = newData['students']
    if 'grader' in newData:
      grader = newData['grader']

    # This might change if the assignment is changed (of course, the requesting user must have the
    # appropriate permissions for the new course to which they are trying to assign this submission).
    course = assignment.course

    # Check that the specified students belong to the submission's course
    badList = []
    for student in students:
      if not isStudent(student, course): # can't add student who is not in the course.
        badList.append(student)
    if len(badList) > 0:
      message = formErrorMessage("The following students are not members of the specified course", badList)
      raise serializers.ValidationError(message)

    # # Check that students are not already tied to other submissions in this course
    # badList = []
    # for student in students:
    #   otherSubs = Submission.objects.filter(assignment=assignment, students__in=[student])
    #   if len(otherSubs) > 0:
    #     badList.append(student)
    # if len(badList) > 0:
    #   message = formErrorMessage("The following students already have submissions for this assignment", badList)
    #   raise serializers.ValidationError(message)

    # Check that the specified students belong to the grader's course
    if grader and not isGrader(grader, course):
      raise serializers.ValidationError(grader.email + " is not a grader of the specified course.")

    return newData

class SubmissionStatusSerializer(serializers.ModelSerializer):
  students = serializers.SlugRelatedField(many=True, slug_field='email', queryset=User.objects.all())

  class Meta:
    model = Submission
    fields = ('id', 'assignment', 'students', 'isFinalized',)
