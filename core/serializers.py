from rest_framework import serializers
from core.models import *

class UserSerializer(serializers.HyperlinkedModelSerializer):
    class Meta:
        model = User
        fields = ('url', 'username', 'email')

class FileSerializer(serializers.ModelSerializer):
	class Meta:
		model = File
		fields = ('name', 'code', 'extension')

class FileWithCommentsSerializer(serializers.ModelSerializer):
	class Meta:
		model = File
		fields = ('name', 'code', 'extension', 'comments')
		depth = 1

class CommentSerializer(serializers.ModelSerializer):
	class Meta:
		model = Comment
		fields = ('text', 'pointDelta', 'startChar', 'endChar')

class CommentWithAuthorSerializer(serializers.ModelSerializer):
	class Meta:
		model = Comment
		fields = ('text', 'pointDelta', 'author', 'startChar', 'endChar')
		depth = 1

class SubmissionSerializer(serializers.ModelSerializer):
	files = FileSerializer(many=True)

	class Meta:
		model = Submission
		fields = ('isFinalized', 'dateFinalized', 'grade', 'files')
		depth = 1

class SubmissionWithCommentsSerializer(serializers.ModelSerializer):
	files = FileWithCommentsSerializer(many=True)

	class Meta:
		model = Submission
		fields = ('isFinalized', 'dateFinalized', 'grade', 'files')
		depth = 1