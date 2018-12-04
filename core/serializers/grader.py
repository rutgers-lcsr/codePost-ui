from rest_framework import serializers
from core.models import Grader
from core.serializers.profile import ProfileSerializer

class GraderSerializer(serializers.HyperlinkedModelSerializer):
  profile = ProfileSerializer()

  class Meta:
      model = Grader
      fields = ('profile',)