from rest_framework import serializers
from core.models import Student
from core.serializers.profile import ProfileSerializer

class StudentSerializer(serializers.HyperlinkedModelSerializer):
  profile = ProfileSerializer()

  class Meta:
      model = Student
      fields = ('profile',)