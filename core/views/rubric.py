from core.models import RubricCategory, RubricComment
from core.serializers.rubric import RubricCategorySerializer, RubricCommentSerializer

from rest_framework import status
from rest_framework import viewsets, generics
from django.core.exceptions import ObjectDoesNotExist, MultipleObjectsReturned
from rest_framework.response import Response
from rest_framework.decorators import action

from core.permissions.helpers import returnNotAuthorized, returnForbidden, returnNotFound
from core.permissions.helpers import isAuthenticated
from core.permissions.helpers import isStudent, isGrader, isCourseAdmin, isCourseMember
from core.permissions.helpers import isStudentOfSub, isStaffOfSub

class RubricViewSet(viewsets.ModelViewSet):
  queryset = RubricCategory.objects.all()
  serializer_class = RubricCategorySerializer


class RubricCommentViewSet(viewsets.ModelViewSet):
  queryset = RubricComment.objects.all()
  serializer_class = RubricCommentSerializer

  
