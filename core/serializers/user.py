from rest_framework import serializers
from core.serializers.course import CourseSerializer
from core.models import User

class UserSerializer(serializers.HyperlinkedModelSerializer):
    class Meta:
        model = User
        fields = ('email', 'id')

class UserWithProfileSerializer(serializers.HyperlinkedModelSerializer):
    studentCourses = CourseSerializer(many=True, source="profile.student.courses")
    graderCourses = CourseSerializer(many=True, source="profile.grader.courses")
    courseadminCourses = CourseSerializer(many=True, source="profile.courseadmin.courses")

    class Meta:
        model = User
        fields = ('email', 'id', 'studentCourses', 'graderCourses', 'courseadminCourses')