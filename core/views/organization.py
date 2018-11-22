from core.models import Organization
from core.serializers.organization import OrganizationSerializer

from rest_framework import status
from rest_framework import viewsets, generics
from django.core.exceptions import ObjectDoesNotExist, MultipleObjectsReturned
from rest_framework.response import Response
from rest_framework.decorators import action

class OrganizationViewSet(viewsets.ModelViewSet):
  queryset = Organization.objects.all()
  serializer_class = OrganizationSerializer