from core.models import Profile
from core.serializers.profile import ProfileSerializer

from rest_framework import status
from rest_framework import viewsets, generics
from django.core.exceptions import ObjectDoesNotExist, MultipleObjectsReturned
from rest_framework.response import Response
from rest_framework.decorators import action

class ProfileViewSet(viewsets.ModelViewSet):
  queryset = Profile.objects.all()
  serializer_class = ProfileSerializer