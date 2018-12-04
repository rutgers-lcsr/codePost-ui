from rest_framework import serializers
from core.models import Comment

class CommentSerializer(serializers.ModelSerializer):
  class Meta:
    model = Comment
    fields = ('id', 'file', 'text', 'pointDelta', 'startChar', 'endChar', 'startLine', 'endLine', 'localId')

class CommentWithAuthorSerializer(serializers.ModelSerializer):
  class Meta:
    model = Comment
    fields = ('id', 'text', 'pointDelta', 'author', 'startChar', 'endChar', 'startLine', 'endLine', 'localId')
    depth = 1