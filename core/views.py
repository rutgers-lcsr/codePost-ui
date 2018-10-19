from django.shortcuts import render
from django.contrib.auth.models import User
from rest_framework import viewsets
from core.serializers import UserSerializer
from rest_framework.response import Response

class UserViewSet(viewsets.ModelViewSet):
  queryset = User.objects.all().order_by('-date_joined')
  serializer_class = UserSerializer


# URL Params:
### app = ['student', 'grader', 'admin']
### user = [current_user]

# Endpoint:
### /courses/?app=student&user=simonstudent
class CourseViewSet(viewsets.ModelViewSet):
  def list(self, request):
    # Permissions (maybe a better way to do this in Django,
    # but this is quite clean I think ... )
    # pseudocode
    _user = request.data['user']
    _app = request.data['app']

    if (self.request.user != _user):
      return Response("Not Authorized", status=status.HTTP_401_UNAUTHORIZED)

    if (_app == 'student'):
      print ('student')
      queryset = _user.profile.student.courses.all()
      serializer = CourseSerializer(queryset, many=True)
      return Response(serializer.data)
    elif (_app == 'grader'):
      print ('grader')
    elif (_app == 'admin'):
      print ('admin')
    else
      return Response("Bad Request"), status=status.HTTP_400_BAD_REQUEST)
