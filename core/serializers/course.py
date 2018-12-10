from rest_framework import serializers
from core.serializers.template import ModelSerializerWithPOSTCheck
from core.models import Course, Organization, User
from core.serializers.assignment import AssignmentSerializer

class CourseSerializer(ModelSerializerWithPOSTCheck):
  class Meta:
    model = Course
    fields = ('id', 'name', 'period', 'organization', 'assignments', 'sections')
    read_only_fields = ('assignments',)
    POST_permissions_fields = ('organization',)

  def create(self, validated_data):
    course = self.tempCreate()
    # make requesting user a courseAdmin here
    course.save()
    return course

class CourseRosterSerializer(ModelSerializerWithPOSTCheck):
  students = serializers.SlugRelatedField(many=True, slug_field='email', queryset=User.objects.all())
  graders = serializers.SlugRelatedField(many=True, slug_field='email', queryset=User.objects.all())
  courseAdmins = serializers.SlugRelatedField(many=True, slug_field='email', queryset=User.objects.all())

  class Meta:
    model = Course
    fields = ('id', 'name', 'period', 'students', 'graders', 'courseAdmins')

