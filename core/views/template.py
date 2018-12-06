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

# class PermissionedViewSet(viewsets.ModelViewSet):
#   # Standard CRUD functions
#   #####################################################################################
#   def list(self, request):
#     user = request.user
#     if not isAuthenticated(user):
#       return returnNotAuthorized()

#     if not user.is_superuser:
#       return returnForbidden()

#     return super().list(request)

#   def create(self, request):
#     user = request.user
#     if not isAuthenticated(user):
#       return returnNotAuthorized()

#     # Create a temporary object to pass to validation function.
#     # This means, unlike the other CRUD functions, we validate the inputs
#     # BEFORE assessing whether the user has the right permissions.
#     serializer = self.get_serializer(data=request.data)
#     serializer.is_valid(raise_exception=True)
#     instance = serializer.tempCreate()
#     isAllowed = assessPermissions(instance, request, "create")
#     if isAllowed:
#       # Use the default serializer class
#       return super().create(request)
#     else:
#       return returnForbidden()

#   def retrieve(self, request, *args, **kwargs):
#     user = request.user
#     if not isAuthenticated(user):
#       return returnNotAuthorized()

#     instance = self.get_object()
#     isAllowed = assessPermissions(instance, request, "retrieve")
#     if isAllowed:
#       # Use the default serializer class
#       return super().retrieve(request, *args, **kwargs)
#     else:
#       return returnForbidden()

#   def update(self, request, *args, **kwargs):
#     user = request.user
#     if not isAuthenticated(user):
#       return returnNotAuthorized()

#     instance = self.get_object()
#     isAllowed = assessPermissions(instance, request, "update")
#     if isAllowed:
#       # Use the default serializer class
#       return super().update(request, *args, **kwargs)
#     else:
#       return returnForbidden()

#   def destroy(self, request, *args, **kwargs):
#     user = request.user
#     if not isAuthenticated(user):
#       return returnNotAuthorized()

#     instance = self.get_object()
#     isAllowed = assessPermissions(instance, request, "destroy")
#     if isAllowed:
#       # Use the default serializer class
#       return super().destroy(request, *args, **kwargs)
#     else:
#       return returnForbidden()

#   #####################################################################################