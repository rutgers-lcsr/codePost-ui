from rest_framework import serializers
from core.models import Course

class CourseSerializer(serializers.ModelSerializer):
	name = serializers.CharField(source='parent.name')

	class Meta:
		model = Course
		fields = ('name', 'period')