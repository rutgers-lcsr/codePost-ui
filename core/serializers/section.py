from rest_framework import serializers
from core.models import Section
from core.serializers.student import StudentSerializer
from core.serializers.grader import GraderSerializer

class SectionSerializer(serializers.ModelSerializer):
  class Meta:
    model = Section
    fields = ('name', 'id', 'course')

class SectionWithStudentsSerializer(serializers.ModelSerializer):
  students = StudentSerializer(many=True)
  leader = GraderSerializer(many=True)

  class Meta:
    model = Section
    fields = ('name', 'id', 'course', 'students', 'leader')
