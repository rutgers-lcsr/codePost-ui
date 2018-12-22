from rest_framework import permissions

from core.permissions.template import TemplatePermission
from core.permissions.helpers import isAuthenticated
from core.permissions.helpers import isStudent, isGrader, isCourseAdmin, isCourseMember, isCourseStaff
from core.permissions.helpers import isSectionLeader, isStudentOfSub, isStaffOfSub
from core.permissions.helpers import isOrganizationMember

# Notes
# https://stackoverflow.com/questions/36553197/permission-checks-in-drf-viewsets-are-not-working-right

############# User Section ####################################################

class OrganizationPermissions(TemplatePermission):
  def has_object_permission(self, request, view, obj):
    user = request.user

    if request.method == "POST":
      return user.is_superuser
    if request.method == "DELETE":
      # Since deleting an organization can have catastrophic cascade effects,
      # we should only allow deletion of an organization object from the terminal.
      # Maybe we can protect it with a confirm pattern.
      return False
    if request.method == "PATCH" or request.method == "PUT":
      return user.is_superuser
    if request.method == "GET":
      return user.is_superuser

class UserPermissions(TemplatePermission):
  def has_object_permission(self, request, view, obj):
    user = request.user

    if request.method == "POST":
      return user.is_superuser
    if request.method == "DELETE":
      return user.is_superuser
    if request.method == "PATCH" or request.method == "PUT":
      return user.is_superuser
    if request.method == "GET":
      return user.is_superuser or user == obj

class CoursePermissions(TemplatePermission):
  def has_object_permission(self, request, view, obj):
    user = request.user
    course = obj

    if request.method == "POST":
      return True
    if request.method == "DELETE":
      return isCourseAdmin(user, course)
    if request.method == "PATCH" or request.method == "PUT":
      return isCourseAdmin(user, course)
    if request.method == "GET":
      return isCourseMember(user, course)

################################################################################

############# Course Infrastructure Section ####################################

class SectionPermissions(TemplatePermission):
  def has_object_permission(self, request, view, obj):
    user = request.user
    course = obj.course

    if request.method == "POST":
      return isCourseAdmin(user, course)
    if request.method == "DELETE":
      return isCourseAdmin(user, course)
    if request.method == "PATCH" or request.method == "PUT":
      return isCourseAdmin(user, course)
    if request.method == "GET":
      return isCourseAdmin(user, course) or isSectionLeader(user, obj)

class AssignmentPermissions(TemplatePermission):
  def has_object_permission(self, request, view, obj):
    user = request.user
    course = obj.course

    if request.method == "POST":
      return isCourseAdmin(user, course)
    if request.method == "DELETE":
      return isCourseAdmin(user, course)
    if request.method == "PATCH" or request.method == "PUT":
      return isCourseAdmin(user, course)
    if request.method == "GET":
      return isCourseMember(user, course)

class RubricCategoryPermissions(TemplatePermission):
  def has_object_permission(self, request, view, obj):
    user = request.user
    course = obj.assignment.course

    if request.method == "POST":
      return isCourseAdmin(user, course)
    if request.method == "DELETE":
      return isCourseAdmin(user, course)
    if request.method == "PATCH" or request.method == "PUT":
      return isCourseAdmin(user, course)
    if request.method == "GET":
      return isCourseStaff(user, course)

class RubricCommentPermissions(TemplatePermission):
  def has_object_permission(self, request, view, obj):
    user = request.user
    course = obj.category.assignment.course

    if request.method == "POST":
      return isCourseAdmin(user, course)
    if request.method == "DELETE":
      return isCourseAdmin(user, course)
    if request.method == "PATCH" or request.method == "PUT":
      return isCourseAdmin(user, course)
    if request.method == "GET":
      return isCourseStaff(user, course)

###############################################################################

############# Submissions Section #############################################

class SubmissionPermissions(TemplatePermission):
  def has_object_permission(self, request, view, obj):
    user = request.user
    course = obj.assignment.course

    if request.method == "POST":
      return isCourseAdmin(user, course)
    if request.method == "DELETE":
      return isCourseAdmin(user, course)
    if request.method == "PATCH" or request.method == "PUT":
      return isCourseAdmin(user, course)
    if request.method == "GET":
      return isStaffOfSub(user, obj) or isStudentOfSub(user, obj)

class FilePermissions(TemplatePermission):
  def has_object_permission(self, request, view, obj):
    return SubmissionPermissions.has_object_permission(self, request, view, obj.submission)

class CommentPermissions(TemplatePermission):
  def has_object_permission(self, request, view, obj):
    user = request.user
    submission = obj.file.submission

    if request.method == "POST":
      return isStaffOfSub(user, submission)
    if request.method == "DELETE":
      return isStaffOfSub(user, submission)
    if request.method == "PATCH" or request.method == "PUT":
      return isStaffOfSub(user, submission)
    if request.method == "GET":
      return SubmissionPermissions.has_object_permission(self, request, view, submission)
