from rest_framework import serializers
from core.models import Comment

class CommentSerializer(serializers.ModelSerializer):
  class Meta:
    model = Comment
    fields = ('text', 'pointDelta', 'startChar', 'endChar')

class CommentWithAuthorSerializer(serializers.ModelSerializer):
  class Meta:
    model = Comment
    fields = ('text', 'pointDelta', 'author', 'startChar', 'endChar')
    depth = 1