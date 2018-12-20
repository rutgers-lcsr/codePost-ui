from core.models import Course
from core.serializers.course import CourseSerializer, CourseRosterSerializer
from core.serializers.section import SectionSerializer
from core.serializers.user import UserSerializer
from core.views.template import ListProtectedViewSet

from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated

from core.permissions.permissions import CoursePermissions
from core.permissions.helpers import returnNotAuthorized, returnForbidden, returnNotFound
from core.permissions.helpers import isAuthenticated
from core.permissions.helpers import isStudent, isGrader, isCourseAdmin, isCourseMember
from core.permissions.helpers import isStudentOfSub, isStaffOfSub

# Can override get_serializer method to use different serializer for different user types

class CourseViewSet(ListProtectedViewSet):
  queryset = Course.objects.all()
  serializer_class = CourseSerializer
  permission_classes = (IsAuthenticated, CoursePermissions)

  @action(detail=True, methods=['GET', 'PATCH'])
  def roster(self, request, pk=None):
    user = request.user
    if not isAuthenticated(user):
      return returnNotAuthorized()

    course = self.get_object()

    if not isCourseAdmin(user, course):
      return returnForbidden()

    if request.method == 'GET':
      serializer = CourseRosterSerializer(course)
      return Response(serializer.data)
    elif request.method == 'PATCH':
      serializer = CourseRosterSerializer(course, data=request.data, partial=True)
      serializer.is_valid(raise_exception=True)
      self.perform_update(serializer)
      return Response(serializer.data)


  @action(detail=True, methods=['patch'])
  def deleteRubricCategory(self, request, pk=None):
    user = request.user
    if not isAuthenticated(user):
      return returnNotAuthorized()

    form = IDForm(request.POST)
    if (form.is_valid()):
      course = Course.objects.get(id=pk)

      if not isCourseAdmin(user, course):
        return returnForbidden()

      try:
        category = RubricCategory.objects.get(id=form.cleaned_data['id'])
      except:
        return returnNotFound(message="Category doesn't exist")

      category.delete()
      return Response(status=status.HTTP_204_NO_CONTENT)
    else:
      return Response(form.errors, status=status.HTTP_400_BAD_REQUEST)
