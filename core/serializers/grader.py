from rest_framework import serializers
from core.models import Grader
from core.serializers.profile import ProfileSerializer

class GraderSerializer(serializers.HyperlinkedModelSerializer):
  username = serializers.CharField(source='profile.user.username')

  class Meta:
      model = Grader
      fields = ('username',)