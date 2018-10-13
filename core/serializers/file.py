from rest_framework import serializers
from core.models import File

class FileSerializer(serializers.ModelSerializer):
	class Meta:
		model = File
		fields = ('name', 'code', 'extension')

class FileWithCommentsSerializer(serializers.ModelSerializer):
	class Meta:
		model = File
		fields = ('name', 'code', 'extension', 'comments')
		depth = 1