from rest_framework import serializers
from core.models import CourseAdmin
from core.serializers.profile import ProfileSerializer

class CourseAdminSerializer(serializers.HyperlinkedModelSerializer):
  profile = ProfileSerializer()

  class Meta:
      model = CourseAdmin
      fields = ('profile',)