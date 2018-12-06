from rest_framework import serializers
from core.models import Submission
from core.serializers.file import FileSerializer, FileWithCommentsSerializer, FileWithCommentsAuthorsSerializer
from core.permissions.helpers import isStudent, isGrader

class SubmissionSerializer(serializers.ModelSerializer):

  class Meta:
    model = Submission
    fields = ('id', 'assignment', 'students', 'grader', 'isFinalized', 'dateFinalized', 'grade')

  # We can't use validate_students, because we need information from the assignment (the course)
  # Note that we're not checking permissions here, though we could...
  # To consider: validate by request type here
  # Pros: more self-documenting (permissions sit with objects)
  def validate(self, data):
    newData = super().validate(data)
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
  class Meta:
    model = Submission
    fields = ('isFinalized', 'id', 'students')

class SubmissionWithCommentsSerializer(serializers.ModelSerializer):
  files = FileWithCommentsSerializer(many=True)

  class Meta:
    model = Submission
    fields = ('isFinalized', 'dateFinalized', 'grade', 'files', 'id', 'students')
    depth = 1

class SubmissionWithCommentsAuthorsSerializer(serializers.ModelSerializer):
  files = FileWithCommentsAuthorsSerializer(many=True)

  class Meta:
    model = Submission
    fields = ('isFinalized', 'dateFinalized', 'grade', 'files', 'id', 'grader', 'students')
    depth = 1