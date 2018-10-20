from django.shortcuts import render
from django.contrib.auth.models import User
from core.models import *
from rest_framework import viewsets, status
from core.serializers.user import UserSerializer
from core.serializers.course import CourseSerializer
from rest_framework.response import Response
from django.apps import apps

class UserViewSet(viewsets.ModelViewSet):
  queryset = User.objects.all().order_by('-date_joined')
  serializer_class = UserSerializer

# URL Params:
### app = ['student', 'grader', 'admin']
### user = [current_user]

# Endpoint:
### /courses/?app=student&user=simonstudent

# can probably throw the validate_request into a global function
class CourseViewSet(viewsets.ModelViewSet):
  queryset = Course.objects.all()
  serializer_class = CourseSerializer
  def list(self, request):
    _user = request.query_params.get('user', None)
    _app = request.query_params.get('app', None)

    # specified user must be authenticated
    # we can override this if super-admin
    if (str(self.request.user) != _user):
      return Response("Not Authorized", status=status.HTTP_401_UNAUTHORIZED)

    # only available apps for /courses are student, grader, admin
    if (_app not in ['student', 'grader', 'courseadmin']):
      return Response("Invalid App", status=status.HTTP_400_BAD_REQUEST)

    # _sga => [<Student>|<Grader>|<Admin>]
    _model = apps.get_model(app_label='core', model_name=_app)
    try:
      _sga = _model.objects.get(profile__user=self.request.user)
    except:
      return Response("Relevant profile not found", status=status.HTTP_404_NOT_FOUND)

    # each app can return unique queries and serializers
    if (_app == 'student'):
      queryset = _sga.courses.all()
      serializer = CourseSerializer(queryset, many=True)
      return Response(serializer.data)
    elif (_app == 'grader'):
      return Response("Grader", status=status.HTTP_200_OK)
    elif (_app == 'courseadmin'):
      return Response("Admin", status=status.HTTP_200_OK)
    else:
      return Response("Bad Request", status=status.HTTP_400_BAD_REQUEST)

