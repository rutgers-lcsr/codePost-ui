from rest_framework import serializers
from core.serializers.template import ModelSerializerWithPOSTCheck
from core.models import Submission, User
from core.serializers.file import FileSerializer
from core.permissions.helpers import isStudent, isGrader

class SubmissionSerializer(ModelSerializerWithPOSTCheck):
  students = serializers.SlugRelatedField(many=True, slug_field='email', queryset=User.objects.all())
  grader = serializers.SlugRelatedField(many=False, slug_field='email', queryset=User.objects.all(), required=False)

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
    elif 'assignment' in newData:
      assignment = newData['assignment']

    course = assignment.course

    if 'students' in newData:
      for student in newData['students']:
        if not isStudent(student, course): # can't add student who is not in the course.
          raise serializers.ValidationError("This student is not a member of the specified course.")

    if 'grader' in newData:
      grader = newData['grader']
      if not isGrader(grader, course):
        raise serializers.ValidationError("This grader is not a member of the specified course.")

    return newData

class SubmissionStatusSerializer(serializers.ModelSerializer):
  students = serializers.SlugRelatedField(many=True, slug_field='email', queryset=User.objects.all())

  class Meta:
    model = Submission
    fields = ('id', 'assignment', 'students', 'isFinalized',)
