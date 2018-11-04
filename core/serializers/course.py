from rest_framework import serializers
from core.models import Course
from core.serializers.assignment import AssignmentSerializer

class CourseSerializer(serializers.ModelSerializer):
  name = serializers.CharField(source='parent.name')
  assignments = AssignmentSerializer(many=True)

  class Meta:
    model = Course
    fields = ('id', 'name', 'period', 'assignments')
    depth = 1