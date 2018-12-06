from rest_framework import serializers
from core.serializers.course import CourseSerializer
from rest_framework_jwt.settings import api_settings
from core.models import User, Organization, Profile

class UserSerializer(serializers.HyperlinkedModelSerializer):
    organization = serializers.PrimaryKeyRelatedField(source="profile.organization", queryset=Organization.objects.all())

    class Meta:
        model = User
        fields = ('email', 'id', 'organization')

class UserWithProfileSerializer(serializers.HyperlinkedModelSerializer):
    studentCourses = CourseSerializer(many=True, source="student_courses")
    graderCourses = CourseSerializer(many=True, source="grader_courses")
    courseadminCourses = CourseSerializer(many=True, source="courseAdmin_courses")

    class Meta:
        model = User
        fields = ('email', 'id', 'studentCourses', 'graderCourses', 'courseadminCourses')

# Original source: https://medium.com/@dakota.lillie/django-react-jwt-authentication-5015ee00ef9a
class UserSerializerWithToken(serializers.ModelSerializer):
    token = serializers.SerializerMethodField()
    password = serializers.CharField(write_only=True)

    def get_token(self, obj):
        jwt_payload_handler = api_settings.JWT_PAYLOAD_HANDLER
        jwt_encode_handler = api_settings.JWT_ENCODE_HANDLER

        payload = jwt_payload_handler(obj)
        token = jwt_encode_handler(payload)
        return token

    def create(self, validated_data):
        password = validated_data.pop('password', None)
        instance = self.Meta.model(**validated_data)
        if password is not None:
            instance.set_password(password)
        instance.save()
        return instance

    class Meta:
        model = User
        fields = ('token', 'username', 'password')