from core.models import Course
from core.serializers.course import CourseSerializer
from core.serializers.section import SectionWithStudentsSerializer
from core.views.template import ListProtectedViewSet

from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated

from core.permissions.permissions import CoursePermissions
from rest_framework import viewsets

class CourseViewSet(ListProtectedViewSet):
  queryset = Course.objects.all()
  serializer_class = CourseSerializer
  permission_classes = (IsAuthenticated, CoursePermissions)

  @action(detail=True)
  def students(self, request, pk=None):
    user = request.user
    if not isAuthenticated(user):
      return returnNotAuthorized()

    course = Course.objects.get(id=pk)

    if not isCourseAdmin(user, course):
      return returnForbidden()

    students = course.students.all()
    serializer = StudentSerializer(students, many=True, context={'request' : request})
    return Response(serializer.data)

  @action(detail=True)
  def graders(self, request, pk=None):
    user = request.user
    if not isAuthenticated(user):
      return returnNotAuthorized()

    course = Course.objects.get(id=pk)

    if not isCourseAdmin(user, course):
      return returnForbidden()

    graders = course.graders.all()
    serializer = GraderSerializer(graders, many=True, context={'request' : request})
    return Response(serializer.data)

  @action(detail=True)
  def courseadmins(self, request, pk=None):
    user = request.user
    if not isAuthenticated(user):
      return returnNotAuthorized()

    course = Course.objects.get(id=pk)

    if not isCourseAdmin(user, course):
      return returnForbidden()

    courseadmins = course.courseAdmins.all()
    serializer = CourseAdminSerializer(courseadmins, many=True, context={'request' : request})
    return Response(serializer.data)

  @action(detail=True)
  def sections(self, request, pk=None):
    user = request.user
    if not isAuthenticated(user):
      return returnNotAuthorized()

    course = Course.objects.get(id=pk)

    if not isCourseAdmin(user, course) and not isGrader(user, course):
      return returnForbidden()

    sections = course.sections.all()
    serializer = SectionWithStudentsSerializer(sections, many=True)
    return Response(serializer.data)


