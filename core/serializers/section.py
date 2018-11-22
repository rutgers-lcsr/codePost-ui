from rest_framework import serializers
from core.models import Section
from core.serializers.student import StudentSerializer

class SectionSerializer(serializers.ModelSerializer):
  class Meta:
    model = Section
    fields = ('name', 'id')

class SectionWithStudentsSerializer(serializers.ModelSerializer):
  students = StudentSerializer(many=True)

  class Meta:
    model = Section
    fields = ('name', 'id', 'students')