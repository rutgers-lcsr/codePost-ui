from rest_framework import serializers
from core.models import Section
from core.permissions.helpers import isGrader, isStudent

class SectionSerializer(serializers.ModelSerializer):
  class Meta:
    model = Section
    fields = ('name', 'id', 'course', 'leaders')

  def validate(self, data):
    newData = super().validate(data)
    course = newData['course']

    if 'leaders' in newData:
      for grader in newData['leaders']:
        if not isGrader(grader, course): # can't add grader who is not in the course.
          raise serializers.ValidationError("This grader is not a member of the specified course.")

    if 'students' in newData:
      for student in newData['students']:
        if not isStudent(student, course): # can't add student who is not in the course.
          raise serializers.ValidationError("This student is not a member of the specified course.")

    return newData

class SectionWithStudentsSerializer(serializers.ModelSerializer):
  class Meta:
    model = Section
    fields = ('name', 'id', 'students')