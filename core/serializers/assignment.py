from rest_framework import serializers
from core.models import Assignment

class AssignmentSerializer(serializers.ModelSerializer):
	name = serializers.CharField(source='parent.name')

	class Meta:
		model = Assignment
		fields = ('name', 'points', 'id')