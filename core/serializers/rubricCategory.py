from rest_framework import serializers
from core.models import RubricCategory

class RubricCategorySerializer(serializers.ModelSerializer):

  class Meta:
    model = RubricCategory
    fields = ('id', 'assignment', 'name', 'pointLimit',)