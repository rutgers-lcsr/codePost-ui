from django.contrib.auth.models import User
from rest_framework import viewsets, generics
from core.serializers.course import CourseSerializer
from core.serializers.user import UserSerializer
from core.serializers.submission import SubmissionWithCommentsSerializer
from core.serializers.assignment import AssignmentSerializer
from rest_framework.response import Response
from core.models import Course, Submission, Assignment
from rest_framework.decorators import action
from rest_framework import status

class UserViewSet(viewsets.ModelViewSet):
  queryset = User.objects.all().order_by('-date_joined')
  serializer_class = UserSerializer

class AssignmentViewSet(viewsets.ModelViewSet):
  queryset = Assignment.objects.all()
  serializer_class = AssignmentSerializer

  @action(detail=True)
  def submissions(self, request, pk=None):
    assignment = Assignment.objects.get(id=pk)
    submissions = assignment.submissions

    username = self.request.query_params.get('username', None)
    if username is not None:
      try:
        user = User.objects.get(username=username)
      except User.DoesNotExist:
        return Response("The user does not exist", status=status.HTTP_404_NOT_FOUND)
      submissions = submissions.filter(students__in=[user.profile.student])

    serializer = SubmissionWithCommentsSerializer(submissions, many=True)
    return Response(serializer.data)


class SubmissionViewSet(viewsets.ModelViewSet):
  queryset = Submission.objects.all()
  serializer_class = SubmissionWithCommentsSerializer


class CourseViewSet(viewsets.ModelViewSet):
  queryset = Course.objects.all()
  serializer_class = CourseSerializer

  # URL Params:
  ### app = ['student', 'grader', 'admin']
  ### /courses/me/?app=<app>/
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
