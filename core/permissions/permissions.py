from rest_framework import permissions
from core.permissions.helpers import isAuthenticated
from core.permissions.helpers import isStudent, isGrader, isCourseAdmin, isCourseMember
from core.permissions.helpers import isStudentOfSub, isStaffOfSub
from core.permissions.helpers import isOrganizationMember

# Notes
# https://stackoverflow.com/questions/36553197/permission-checks-in-drf-viewsets-are-not-working-right

############# User Section ####################################################

class OrganizationPermissions(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
      user = request.user

      if request.method == "POST":
        return user.is_superuser
      if request.method == "DELETE":
        # Since deleting an organization can have catatrsophic cascase effects,
        # we should only allow deletion of an organization object from the terminal.
        # Maybe we can protect it with a confirm pattern.
        return False
      if request.method == "PATCH":
        return user.is_superuser
      if request.method == "GET":
        return user.is_superuser

class UserPermissions(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
      user = request.user

      if request.method == "POST":
        return user.is_superuser
      if request.method == "DELETE":
        return user.is_superuser
      if request.method == "PATCH":
        return user.is_superuser
      if request.method == "GET":
        return user.is_superuser or user == obj


class CoursePermissions(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
      user = request.user
      course = obj

      if request.method == "POST":
        return isCourseAdmin(user, course)
      if request.method == "DELETE":
        return isCourseAdmin(user, course)
      if request.method == "PATCH":
        return isCourseAdmin(user, course)
      if request.method == "GET":
        return isOrganizationMember(user, course.organization)

################################################################################

############# Course Infrastructure Section ####################################

class SectionPermissions(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
      user = request.user
      course = obj.course

      if request.method == "POST":
        return isCourseAdmin(user, course)
      if request.method == "DELETE":
        return isCourseAdmin(user, course)
      if request.method == "PATCH":
        return isCourseAdmin(user, course)
      if request.method == "GET":
        return isCourseAdmin(user, course.organization)

class AssignmentPermissions(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
      user = request.user
      course = obj.course

      if request.method == "POST":
        return isCourseAdmin(user, course)
      if request.method == "DELETE":
        return isCourseAdmin(user, course)
      if request.method == "PATCH":
        return isCourseAdmin(user, course)
      if request.method == "GET":
        return isCourseMember(user, course.organization)

class RubricCategoryPermissions(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
      user = request.user
      course = obj.assignment.course

      if request.method == "POST":
        return isCourseAdmin(user, course)
      if request.method == "DELETE":
        return isCourseAdmin(user, course)
      if request.method == "PATCH":
        return isCourseAdmin(user, course)
      if request.method == "GET":
        return isCourseAdmin(user, course.organization)

class RubricCommentPermissions(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
      user = request.user
      course = obj.category.assignment.course

      if request.method == "POST":
        return isCourseAdmin(user, course)
      if request.method == "DELETE":
        return isCourseAdmin(user, course)
      if request.method == "PATCH":
        return isCourseAdmin(user, course)
      if request.method == "GET":
        return isCourseAdmin(user, course.organization)


###############################################################################

############# Submissions Section #############################################

class SubmissionPermissions(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
      user = request.user
      course = obj.assignment.course

      if request.method == "POST":
        return isCourseAdmin(user, course)
      if request.method == "DELETE":
        return isCourseAdmin(user, course)
      if request.method == "PATCH":
        return isCourseAdmin(user, course)
      if request.method == "GET":
        return isStaffOfSub(user, obj) or isStudentOfSub(user, obj)

class FilePermissions(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
      return SubmissionPermissions.has_object_permission(self, request, view, obj.submission)

class CommentPermissions(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
      user = request.user
      submission = obj.file.submission

      if request.method == "POST":
        return isStaffOfSub(user, submission)
      if request.method == "DELETE":
        return isStaffOfSub(user, submission)
      if request.method == "PATCH":
        return isStaffOfSub(user, submission)
      if request.method == "GET":
        return isStaffOfSub(user, submission) or isStudentOfSub(user, submission)
