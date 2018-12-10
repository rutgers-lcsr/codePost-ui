from rest_framework import serializers
from core.serializers.template import ModelSerializerWithPOSTCheck
from core.models import Comment, User
from core.permissions.helpers import isGrader, isStudent
import re

class CommentSerializer(ModelSerializerWithPOSTCheck):
  author = serializers.SlugRelatedField(many=False, slug_field='email', queryset=User.objects.all(), required=False)

  class Meta:
    model = Comment
    fields = ('id', 'text', 'pointDelta', 'startChar', 'endChar', 'startLine', 'endLine', 'file', 'rubricComment', 'author')
    read_only_fields = ('author',)
    POST_permissions_fields = ('file',)

  def create(self, validated_data):
    obj = super().create(validated_data)
    obj.author = self.context['request'].user
    obj.save()
    return obj

  def validate_startChar(self, data):
    if data < 0:
      raise serializers.ValidationError("startChar cannot be less than 0")
    return data

  def validate_endChar(self, data):
    if data < 0:
      raise serializers.ValidationError("startChar cannot be less than 0")
    return data

  def validate_startLine(self, data):
    if data < 0:
      raise serializers.ValidationError("startLine cannot be less than 0")
    return data

  def validate_endLine(self, data):
    if data < 0:
      raise serializers.ValidationError("endLine cannot be less than 0")
    return data

  def validate(self, data):
    newData = super().validate(data)
    startChar = newData['startChar']
    endChar = newData['endChar']
    startLine = newData['startLine']
    endLine = newData['endLine']
    file = newData['file']

    if endChar < startChar:
      raise serializers.ValidationError("endChar cannot be < startChar")

    if endLine < startLine:
      raise serializers.ValidationError("endLine cannot be < startLine")

    # Check that endLine does not exceed the number of lines in the file
    numMatches = len(re.findall("\n", file.code))
    if endLine > numMatches:
      raise serializers.ValidationError("endLine exceeds the lines in the specified file's code")

    # Check that author belongs to the right course
    if 'author' in newData:
      author = newData['author']
      course = file.submission.assignment.course
      if not isGrader(author, course):
        raise serializers.ValidationError("Grader must be a valid grader in the same course as the specified file.")

    # Check that rubricComment and file belong to the same assignment
    if 'rubricComment' in newData:
      rubricComment = newData['rubricComment']
      if rubricComment.category.assignment != file.submission.assignment:
        raise serializers.ValidationError("File and rubricComment must belong to the same assignment.")

    return newData