from core.models import Student
from core.serializers.student import StudentSerializer
from core.serializers.course import CourseSerializer

from rest_framework import status
from rest_framework import viewsets, generics
from django.core.exceptions import ObjectDoesNotExist, MultipleObjectsReturned
from rest_framework.response import Response
from rest_framework.decorators import action

from core.permissions.helpers import returnNotAuthorized, returnForbidden, returnNotFound
from core.permissions.helpers import isAuthenticated
from core.permissions.helpers import isStudent, isGrader, isCourseAdmin, isCourseMember
from core.permissions.helpers import isStudentOfSub, isStaffOfSub

class StudentViewSet(viewsets.ModelViewSet):
  queryset = Student.objects.all()
  serializer_class = StudentSerializer

  @action(detail=False)
  def myCourses(self, request):
    user = request.user
    if not isAuthenticated(user):
      return returnNotAuthorized()

    courses = user.profile.student.courses.all()
    serializer = CourseSerializer(courses, many=True)
    return Response(serializer.data)