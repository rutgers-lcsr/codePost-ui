from rest_framework import serializers
from core.models import Submission
from core.serializers.file import FileSerializer, FileWithCommentsSerializer, FileWithCommentsAuthorsSerializer
from core.serializers.grader import GraderSerializer
from core.serializers.student import StudentSerializer
from core.serializers.assignment import AssignmentSerializer

class SubmissionStatusSerializer(serializers.ModelSerializer):
  students = StudentSerializer(many=True)

  class Meta:
    model = Submission
    fields = ('isFinalized', 'id', 'students')

class SubmissionSerializer(serializers.ModelSerializer):
  students = StudentSerializer(many=True)
  files = FileSerializer(many=True)

  class Meta:
    model = Submission
    fields = ('isFinalized', 'dateFinalized', 'grade', 'files', 'id', 'students')
    depth = 1

class SubmissionWithCommentsSerializer(serializers.ModelSerializer):
  students = StudentSerializer(many=True)
  files = FileWithCommentsSerializer(many=True)

  class Meta:
    model = Submission
    fields = ('isFinalized', 'dateFinalized', 'grade', 'files', 'id', 'students')
    depth = 1

class SubmissionWithCommentsAuthorsSerializer(serializers.ModelSerializer):
  students = StudentSerializer(many=True)
  files = FileWithCommentsAuthorsSerializer(many=True)
  grader = GraderSerializer()
  assignment = AssignmentSerializer()

  class Meta:
    model = Submission
    fields = ('id', 'assignment', 'isFinalized', 'dateFinalized', 'grade', 'files', 'grader', 'students')
    depth = 1