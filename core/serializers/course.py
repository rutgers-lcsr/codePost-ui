from rest_framework import serializers
from core.serializers.template import ModelSerializerWithPOSTCheck
from core.models import Course, Organization, User
from core.serializers.assignment import AssignmentSerializer

class CourseSerializer(ModelSerializerWithPOSTCheck):
  class Meta:
    model = Course
    fields = ('id', 'name', 'period', 'organization', 'assignments', 'sections')
    read_only_fields = ('assignments', 'organization')
    POST_permissions_fields = ()

  def create(self, validated_data):
    courseAdmin = self.context['request'].user

    # Organization is required, so have to add before creating object (which
    # includes saving the object to database)
    validated_data['organization'] = courseAdmin.profile.organization
    obj = super().create(validated_data)

    # Force organization equal to posting user's organization
    obj.courseAdmins.add(courseAdmin)
    obj.save()
    return obj

class CourseRosterSerializer(ModelSerializerWithPOSTCheck):
  students = serializers.SlugRelatedField(many=True, slug_field='email', queryset=User.objects.all())
  graders = serializers.SlugRelatedField(many=True, slug_field='email', queryset=User.objects.all())
  courseAdmins = serializers.SlugRelatedField(many=True, slug_field='email', queryset=User.objects.all())

  class Meta:
    model = Course
    fields = ('id', 'name', 'period', 'students', 'graders', 'courseAdmins')

