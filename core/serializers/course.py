from rest_framework import serializers
from core.serializers.template import ModelSerializerWithPOSTCheck
from core.models import Course, Organization, User
from core.serializers.assignment import AssignmentSerializer
from rest_framework.validators import UniqueTogetherValidator

class CourseSerializer(ModelSerializerWithPOSTCheck):
  class Meta:
    model = Course
    fields = ('id', 'name', 'period', 'organization', 'assignments', 'sections')
    read_only_fields = ('assignments', 'organization', 'sections')
    POST_permissions_fields = ()

  def validate(self, data):
    newData = super().validate(data)

    if self.instance:
      organization = self.instance.organization
      name = self.instance.name
    else:
      courseAdmin = self.context['request'].user
      organization = courseAdmin.profile.organization

    if 'name' in newData:
      name = newData['name']

    # Manually establish unique_together(name, organization) constraint
    others = Course.objects.filter(name=name, organization=organization)
    if len(others) > 0:
      # Should raise a unique together issue here
      raise serializers.ValidationError("The fields name, organization must make a unique set.")

    return newData

  def create(self, validated_data):
    courseAdmin = self.context['request'].user

    # Organization is required, so have to add before creating object (which
    # includes saving the object to database)
    validated_data['organization'] = courseAdmin.profile.organization
    obj = super().create(validated_data)

    # Make requesting user a courseAdmin of the course
    obj.courseAdmins.add(courseAdmin)
    obj.save()
    return obj

class CourseRosterSerializer(ModelSerializerWithPOSTCheck):
  students = serializers.SlugRelatedField(many=True, slug_field='email', queryset=User.objects.all(), allow_null=True)
  graders = serializers.SlugRelatedField(many=True, slug_field='email', queryset=User.objects.all(), allow_null=True)
  courseAdmins = serializers.SlugRelatedField(many=True, slug_field='email', queryset=User.objects.all(), allow_null=True)

  class Meta:
    model = Course
    fields = ('id', 'name', 'period', 'students', 'graders', 'courseAdmins')

