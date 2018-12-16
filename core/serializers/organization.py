from rest_framework import serializers
from core.serializers.template import ModelSerializerWithPOSTCheck
from core.models import Organization

class OrganizationSerializer(ModelSerializerWithPOSTCheck):

  class Meta:
    model = Organization
    fields = ('name', 'shortname', 'id')