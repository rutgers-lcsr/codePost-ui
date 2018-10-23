from django.contrib.auth.models import User
from core.models import Student, Grader, CourseAdmin
from core.models import Course, Assignment, Submission

from rest_framework.response import Response
from rest_framework import status


NOT_AUTHORIZED = "You are not logged in. Please log in."
FORBIDDEN = "You do not have the appropriate permissions to perform this action."
NOT_FOUND = "The object you requested could not be found."

def returnNotAuthorized():
  return Response(NOT_AUTHORIZED, status.HTTP_401_UNAUTHORIZED)

def returnForbidden():
  return Response(FORBIDDEN, status.HTTP_403_FORBIDDEN)

def returnNotFound(message=None):
  if message is None:
    return Response(NOT_FOUND, status.HTTP_403_FORBIDDEN)
  else:
    return Response(message, status.HTTP_403_FORBIDDEN)

def isAuthenticated(user):
  return user.is_authenticated

def isStudent(user, course):
  return user.profile.student in course.students.all()

def isGrader(user, course):
  return user.profile.grader in course.graders.all()

def isCourseAdmin(user, course):
  return user.profile.courseadmin in course.courseAdmins.all()

def isCourseMember(user, course):
  return isStudent(user, course) or isGrader(user, course) or isCourseAdmin(user, course)

def isStudentOfSub(user, submission):
  return user.profile.student in submission.students.all()

def isStaffOfSub(user, submission):
  return (user.profile.grader == submission.grader) or isCourseAdmin(user, submission.assignment.course)


