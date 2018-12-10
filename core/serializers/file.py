from rest_framework import serializers
from core.serializers.template import ModelSerializerWithPOSTCheck
from core.models import File

class FileSerializer(ModelSerializerWithPOSTCheck):
  class Meta:
    model = File
    fields = ('name', 'code', 'extension', 'submission', 'id', 'comments')
    POST_permissions_fields = ('submission',)