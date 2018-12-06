from rest_framework import serializers
from core.models import RubricComment

class RubricCommentSerializer(serializers.ModelSerializer):

  class Meta:
    model = RubricComment
    fields = ('id', 'text', 'pointDelta', 'category',)