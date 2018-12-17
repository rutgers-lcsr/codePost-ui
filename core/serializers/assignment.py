from rest_framework import serializers
from core.serializers.template import ModelSerializerWithPOSTCheck
from core.models import Assignment

class AssignmentSerializer(ModelSerializerWithPOSTCheck):
  class Meta:
    model = Assignment
    fields = ('id', 'name', 'points', 'isReleased', 'course', 'rubricCategories')
    POST_permissions_fields = ('course',)