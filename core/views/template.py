from rest_framework import viewsets
from core.permissions.helpers import returnNotAuthorized, returnForbidden, returnNotFound
from core.permissions.helpers import isAuthenticated
from core.permissions.helpers import isStudent, isGrader, isCourseAdmin, isCourseMember
from core.permissions.helpers import isStudentOfSub, isStaffOfSub

class ListProtectedViewSet(viewsets.ModelViewSet):
  def list(self, request):
    user = request.user
    if not isAuthenticated(user):
      return returnNotAuthorized()

    if not user.is_superuser:
      return returnForbidden()

    return super().list(request)