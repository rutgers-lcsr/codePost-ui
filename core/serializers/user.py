from rest_framework import serializers
from core.serializers.template import ModelSerializerWithPOSTCheck
from core.serializers.course import CourseSerializer
from rest_framework_jwt.settings import api_settings
from core.models import User, Organization, Profile


# Helpful source: https://medium.com/@dakota.lillie/django-react-jwt-authentication-5015ee00ef9a
class UserSerializer(ModelSerializerWithPOSTCheck):
  organization = serializers.PrimaryKeyRelatedField(source="profile.organization", queryset=Organization.objects.all())
  # token = serializers.SerializerMethodField()
  password = serializers.CharField(write_only=True)

  class Meta:
      model = User
      fields = ('id', 'email', 'password', 'organization')
      POST_permissions_fields = ()

  # def get_token(self, obj):
  #     jwt_payload_handler = api_settings.JWT_PAYLOAD_HANDLER
  #     jwt_encode_handler = api_settings.JWT_ENCODE_HANDLER

  #     payload = jwt_payload_handler(obj)
  #     token = jwt_encode_handler(payload)
  #     return token

  def create(self, validated_data):

    # Extract parameters that can't be used in User constructor
    profile = validated_data.pop('profile')
    password = validated_data.pop('password', None)

    # Create object
    validated_data['username'] = validated_data['email']
    obj = super().create(validated_data)

    # Set organization on profile
    obj.profile.organization = profile["organization"]

    # Set password
    if password is not None:
      obj.set_password(password)

    obj.save()
    return obj

class UserWithProfileSerializer(ModelSerializerWithPOSTCheck):
  studentCourses = CourseSerializer(many=True, source="student_courses")
  graderCourses = CourseSerializer(many=True, source="grader_courses")
  courseadminCourses = CourseSerializer(many=True, source="courseAdmin_courses")

  class Meta:
      model = User
      fields = ('email', 'id', 'studentCourses', 'graderCourses', 'courseadminCourses')

# Original source: