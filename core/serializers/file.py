from rest_framework import serializers
from core.models import File
from core.serializers.comment import CommentSerializer, CommentWithAuthorSerializer

class FileSerializer(serializers.ModelSerializer):
  class Meta:
    model = File
    fields = ('name', 'code', 'extension', 'submission', 'id')

class FileWithCommentsSerializer(serializers.ModelSerializer):
  comments = CommentSerializer(many=True)

  class Meta:
    model = File
    fields = ('name', 'code', 'extension', 'submission', 'comments', 'id')
    depth = 1

class FileWithCommentsAuthorsSerializer(serializers.ModelSerializer):
  comments = CommentWithAuthorSerializer(many=True)

  class Meta:
    model = File
    fields = ('name', 'code', 'extension', 'submission', 'comments', 'id')
    depth = 1