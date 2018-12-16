from rest_framework import serializers
from core.serializers.template import ModelSerializerWithPOSTCheck
from core.models import RubricComment

class RubricCommentSerializer(ModelSerializerWithPOSTCheck):

  class Meta:
    model = RubricComment
    fields = ('id', 'text', 'pointDelta', 'category',)
    POST_permissions_fields = ('category',)