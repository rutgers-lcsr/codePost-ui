from rest_framework import serializers
from core.models import RubricCategory, RubricComment
from core.serializers.assignment import AssignmentSerializer

class RubricCommentSerializer(serializers.ModelSerializer):
  class Meta:
    model = RubricComment
    fields = ('id', 'text', 'pointDelta')


class RubricCategorySerializer(serializers.ModelSerializer):
  assignment = AssignmentSerializer()
  categoryComments = RubricCommentSerializer(many=True)

  class Meta:
    model = RubricCategory
    fields = ('id', 'assignment', 'name', 'pointLimit', 'categoryComments')
