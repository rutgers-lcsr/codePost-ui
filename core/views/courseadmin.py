from core.models import CourseAdmin
from core.serializers.courseadmin import CourseAdminSerializer
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

class CourseAdminViewSet(viewsets.ModelViewSet):
  queryset = CourseAdmin.objects.all()
  serializer_class = CourseAdminSerializer

  @action(detail=False)
  def myCourses(self, request):
    user = request.user
    if not isAuthenticated(user):
      return returnNotAuthorized()

    courses = user.profile.courseadmin.courses.all()
    serializer = CourseSerializer(courses, many=True)
    return Response(serializer.data)