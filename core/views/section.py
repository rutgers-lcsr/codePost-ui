from core.models import Section
from core.serializers.section import SectionSerializer

from rest_framework import status
from rest_framework import viewsets, generics
from django.core.exceptions import ObjectDoesNotExist, MultipleObjectsReturned
from rest_framework.response import Response
from rest_framework.decorators import action

class SectionViewSet(viewsets.ModelViewSet):
  queryset = Section.objects.all()
  serializer_class = SectionSerializer