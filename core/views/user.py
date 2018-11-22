from django.contrib.auth.models import User
from core.serializers.user import UserSerializer, UserWithProfileSerializer

from rest_framework import status
from rest_framework import viewsets, generics
from django.core.exceptions import ObjectDoesNotExist, MultipleObjectsReturned
from rest_framework.response import Response
from rest_framework.decorators import action

from core.permissions.helpers import returnNotAuthorized, returnForbidden, returnNotFound
from core.permissions.helpers import isAuthenticated
from core.permissions.helpers import isStudent, isGrader, isCourseAdmin, isCourseMember
from core.permissions.helpers import isStudentOfSub, isStaffOfSub

class UserViewSet(viewsets.ModelViewSet):
  queryset = User.objects.all().order_by('-date_joined')
  serializer_class = UserSerializer

  @action(detail=False)
  def me(self, request):
    user = request.user
    if not isAuthenticated(user):
      return returnNotAuthorized()

    serializer = UserWithProfileSerializer(user)
    return Response(serializer.data)