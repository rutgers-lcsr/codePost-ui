from rest_framework import serializers
from core.models import Course, Organization
from core.serializers.assignment import AssignmentSerializer

class CourseSerializer(serializers.ModelSerializer):
  assignments = AssignmentSerializer(many=True, read_only=True)

  class Meta:
    model = Course
    fields = ('id', 'name', 'period', 'assignments', 'organization')
    read_only_fields = ('assignments',)

  def create(self, validated_data):
    course = self.tempCreate()

    # make requesting user a courseAdmin here

    course.save()
    return course
