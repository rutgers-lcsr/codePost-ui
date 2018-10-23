from core.models import Course
from core.serializers.course import CourseSerializer
from core.serializers.section import SectionWithStudentsSerializer
from core.serializers.student import StudentSerializer
from core.serializers.grader import GraderSerializer
from core.serializers.courseadmin import CourseAdminSerializer

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

  @action(detail=True, methods=['patch'])
  def removeStudent(self, request, pk=None):
    user = request.user
    if not isAuthenticated(user):
      return returnNotAuthorized()

    course = Course.objects.get(id=pk)

    if not isCourseAdmin(user, course):
      return returnForbidden()

    username = self.request.query_params.get('username', None)
    if username is None:
      return Response("Please specify a username", status=status.HTTP_400_BAD_REQUEST)

    try:
      userParameter = User.objects.get(username=username)
    except:
      # Should trigger sign up flow here
      return returnNotFound(message="Student does not exist")

    if userParameter.profile.student not in course.students.all():
      return Response("User is not enrolled as a student in this course", status=status.HTTP_400_BAD_REQUEST)

    course.students.remove(userParameter.profile.student)
    course.save()
    serializer = StudentSerializer(userParameter.profile.student ,context={'request' : request})
    return Response(serializer.data)

  @action(detail=True, methods=['patch'])
  def removeGrader(self, request, pk=None):
    user = request.user
    if not isAuthenticated(user):
      return returnNotAuthorized()

    course = Course.objects.get(id=pk)

    if not isCourseAdmin(user, course):
      return returnForbidden()

    username = self.request.query_params.get('username', None)
    if username is None:
      return Response("Please specify a username", status=status.HTTP_400_BAD_REQUEST)

    try:
      userParameter = User.objects.get(username=username)
    except:
      # Should trigger sign up flow here
      return returnNotFound(message="Grader does not exist")

    if userParameter.profile.grader not in course.graders.all():
      return Response("User is not enrolled as a grader in this course", status=status.HTTP_400_BAD_REQUEST)

    course.graders.remove(userParameter.profile.grader)
    course.save()
    serializer = GraderSerializer(userParameter.profile.grader ,context={'request' : request})
    return Response(serializer.data)

  @action(detail=True, methods=['patch'])
  def removeCourseAdmin(self, request, pk=None):
    user = request.user
    if not isAuthenticated(user):
      return returnNotAuthorized()

    course = Course.objects.get(id=pk)

    if not isCourseAdmin(user, course):
      return returnForbidden()

    username = self.request.query_params.get('username', None)
    if username is None:
      return Response("Please specify a username", status=status.HTTP_400_BAD_REQUEST)

    try:
      userParameter = User.objects.get(username=username)
    except:
      # Should trigger sign up flow here
      return returnNotFound(message="Grader does not exist")

    if userParameter.profile.courseadmin not in course.courseAdmins.all():
      return Response("User is not enrolled as a course admin in this course", status=status.HTTP_400_BAD_REQUEST)

    course.courseAdmins.remove(userParameter.profile.courseadmin)
    course.save()
    serializer = CourseAdminSerializer(userParameter.profile.courseadmin ,context={'request' : request})
    return Response(serializer.data)

  @action(detail=True, methods=['patch'])
  def enrollStudent(self, request, pk=None):
    user = request.user
    if not isAuthenticated(user):
      return returnNotAuthorized()

    course = Course.objects.get(id=pk)

    if not isCourseAdmin(user, course):
      return returnForbidden()

    username = self.request.query_params.get('username', None)
    if username is None:
      return Response("Please specify a username", status=status.HTTP_400_BAD_REQUEST)

    try:
      userParameter = User.objects.get(username=username)
    except:
      # Should trigger sign up flow here
      return returnNotFound(message="Student does not exist")

    course.students.add(userParameter.profile.student)
    course.save()
    serializer = StudentSerializer(userParameter.profile.student ,context={'request' : request})
    return Response(serializer.data)

  @action(detail=True, methods=['patch'])
  def enrollGrader(self, request, pk=None):
    user = request.user
    if not isAuthenticated(user):
      return returnNotAuthorized()

    course = Course.objects.get(id=pk)

    if not isCourseAdmin(user, course):
      return returnForbidden()

    username = self.request.query_params.get('username', None)
    if username is None:
      return Response("Please specify a username", status=status.HTTP_400_BAD_REQUEST)

    try:
      userParameter = User.objects.get(username=username)
    except:
      # Should trigger sign up flow here
      return returnNotFound(message="Student does not exist")

    course.graders.add(userParameter.profile.grader)
    course.save()
    serializer = GraderSerializer(userParameter.profile.grader ,context={'request' : request})
    return Response(serializer.data)

  @action(detail=True, methods=['patch'])
  def enrollCourseAdmin(self, request, pk=None):
    user = request.user
    if not isAuthenticated(user):
      return returnNotAuthorized()

    course = Course.objects.get(id=pk)

    if not isCourseAdmin(user, course):
      return returnForbidden()

    username = self.request.query_params.get('username', None)
    if username is None:
      return Response("Please specify a username", status=status.HTTP_400_BAD_REQUEST)

    try:
      userParameter = User.objects.get(username=username)
    except:
      # Should trigger sign up flow here
      return returnNotFound(message="Student does not exist")

    course.courseAdmins.add(userParameter.profile.courseadmin)
    course.save()
    serializer = CourseAdminSerializer(userParameter.profile.courseadmin ,context={'request' : request})
    return Response(serializer.data)

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


