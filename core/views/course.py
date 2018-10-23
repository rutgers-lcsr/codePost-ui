from core.models import Course
from core.serializers.course import CourseSerializer
from core.serializers.section import SectionWithStudentsSerializer

from rest_framework import status
from rest_framework import viewsets, generics
from django.core.exceptions import ObjectDoesNotExist, MultipleObjectsReturned
from rest_framework.response import Response
from rest_framework.decorators import action

from core.permissions.helpers import returnNotAuthorized, returnForbidden, returnNotFound
from core.permissions.helpers import isAuthenticated
from core.permissions.helpers import isStudent, isGrader, isCourseAdmin, isCourseMember
from core.permissions.helpers import isStudentOfSub, isStaffOfSub

class CourseViewSet(viewsets.ModelViewSet):
  queryset = Course.objects.all()
  serializer_class = CourseSerializer

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

    courseadmins = course.courseadmins.all()
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
