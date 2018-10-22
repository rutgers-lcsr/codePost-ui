from rest_framework import serializers
from core.models import Submission
from core.serializers.file import FileSerializer, FileWithCommentsSerializer, FileWithCommentsAuthorsSerializer

class SubmissionSerializer(serializers.ModelSerializer):
  files = FileSerializer(many=True)

  class Meta:
    model = Submission
    fields = ('isFinalized', 'dateFinalized', 'grade', 'files')
    depth = 1

class SubmissionWithCommentsSerializer(serializers.ModelSerializer):
  files = FileWithCommentsSerializer(many=True)

  class Meta:
    model = Submission
    fields = ('isFinalized', 'dateFinalized', 'grade', 'files')
    depth = 1

class SubmissionWithCommentsAuthorsSerializer(serializers.ModelSerializer):
  files = FileWithCommentsAuthorsSerializer(many=True)

  class Meta:
    model = Submission
    fields = ('isFinalized', 'dateFinalized', 'grade', 'files')
    depth = 1