from rest_framework import serializers
from core.models import Profile

class ProfileSerializer(serializers.HyperlinkedModelSerializer):
    email = serializers.CharField(source='user.email')

    class Meta:
        model = Profile
        fields = ('email', 'id')