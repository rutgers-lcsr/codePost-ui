from django.shortcuts import render
from django.contrib.auth.models import User
from rest_framework import viewsets
from core.serializers.course import CourseSerializer
from core.serializers.user import UserSerializer
from rest_framework.response import Response
from core.models import Course
from rest_framework.decorators import action
from rest_framework import status

class UserViewSet(viewsets.ModelViewSet):
  queryset = User.objects.all().order_by('-date_joined')
  serializer_class = UserSerializer

# URL Params:
### app = ['student', 'grader', 'admin']
### user = [current_user]

# Endpoint:
### /courses/me/<app>/
class CourseViewSet(viewsets.ModelViewSet):
  queryset = Course.objects.all()
  serializer_class = CourseSerializer

  @action(detail=False)
  def me(self, request):
    user = request.user
    app = request.query_params.get('app', None)

    if not request.user.is_authenticated:
      return Response("Not Authorized", status=status.HTTP_401_UNAUTHORIZED)

    if app is None:
      return Response("Please specify an app", status=status.HTTP_400_BAD_REQUEST)

    if (app == 'student'):
      queryset = user.profile.student.courses.all()
      serializer = CourseSerializer(queryset, many=True)
      return Response(serializer.data)
    elif (app == 'grader'):
      queryset = user.profile.grader.courses.all()
      serializer = CourseSerializer(queryset, many=True)
      return Response(serializer.data)
    elif (app == 'admin'):
      queryset = user.profile.courseadmin.courses.all()
      serializer = CourseSerializer(queryset, many=True)
      return Response(serializer.data)
    else:
      return Response("Bad Request", status=status.HTTP_400_BAD_REQUEST)
