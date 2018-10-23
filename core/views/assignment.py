from core.models import Assignment
from core.serializers.assignment import AssignmentSerializer
from core.serializers.submission import SubmissionWithCommentsSerializer, SubmissionWithCommentsAuthorsSerializer

from rest_framework import status
from rest_framework import viewsets, generics
from django.core.exceptions import ObjectDoesNotExist, MultipleObjectsReturned
from rest_framework.response import Response
from rest_framework.decorators import action

from core.permissions.helpers import returnNotAuthorized, returnForbidden, returnNotFound
from core.permissions.helpers import isAuthenticated
from core.permissions.helpers import isStudent, isGrader, isCourseAdmin, isCourseMember
from core.permissions.helpers import isStudentOfSub, isStaffOfSub

class AssignmentViewSet(viewsets.ModelViewSet):
  queryset = Assignment.objects.all()
  serializer_class = AssignmentSerializer

  @action(detail=True)
  def drawUnassigned(self, request, pk=None):
    user = request.user
    if not isAuthenticated(user):
      return returnNotAuthorized()

    assignment = Assignment.objects.get(id=pk)
    course = assignment.course

    if not isGrader(user, course):
      return returnForbidden()

    section = self.request.query_params.get('section', None)

    # Use system ordering to pull random unassigned submission
    submissions = Assignment.submissions.filter(grader=None)
    if section is not None:
      try:
        section = Section.objects.get(name=section, course=course)
        submissions = submissions.filter(students__in=[section.students.all()])
      except ObjectDoesNotExist:
        return returnNotFound(message="No such section")

    submission = None
    if len(submissions) > 0:
      submission = submissions[0]

    serializer = SubmissionWithCommentsAuthorsSerializer(submission)
    return Response(serializer.data)

  @action(detail=True)
  def graderList(self, request, pk=None):
    user = request.user
    if not isAuthenticated(user):
      return returnNotAuthorized()

    assignment = Assignment.objects.get(id=pk)

    if not isGrader(user, course) and not isCourseAdmin(user, course):
      return returnForbidden()

    username = self.request.query_params.get('username', None)
    if username is None:
      return Response("Please specify a grader", status=status.HTTP_400_BAD_REQUEST)

    try:
      user = User.objects.get(username=username)
    except User.DoesNotExist:
      return returnNotFound(message="This grader does not exist in your course.")

    if user.profile.grader not in course.graders.all():
      return returnNotFound(message="This grader does not exist in your course.")

    submissions = Submission.objects.filter(course=course, grader=user.profile.grader)
    serializer = SubmissionWithCommentsAuthorsSerializer(submissions, many=True)
    return Response(serializer.data)

  @action(detail=True)
  def submissions(self, request, pk=None):
    user = request.user
    if not isAuthenticated(user):
      return returnNotAuthorized()

    assignment = Assignment.objects.get(id=pk)
    course = assignment.course

    if not isCourseMember(user, course):
      return returnForbidden()

    username = self.request.query_params.get('username', None)
    submissions = assignment.submissions

    if username is None:
      if not isCourseAdmin(user, course):
        return returnForbidden()
      serializer = SubmissionWithCommentsAuthorsSerializer(submissions, many=True)
      return Response(serializer.data)

    try:
      userParameter = User.objects.get(username=username)
    except User.DoesNotExist:
      if isCourseAdmin(user, course):
        return returnNotFound(message="The user does not exist")
      else:
        return returnForbidden()

    try:
      submission = submissions.get(students__in=[userParameter.profile.student])
    except MultipleObjectsReturned:
      if isCourseAdmin(user, course):
        return Response("Multiple objects returned", status=status.HTTP_500_INTERNAL_SERVER_ERROR)
      else:
        return returnForbidden()
    except DoesNotExist:
      if isCourseAdmin(user, course):
        return returnNotFound(message="The submission does not exist")
      else:
        return returnForbidden()

    if isStaffOfSub(user, submission):
      serializer = SubmissionWithCommentsAuthorsSerializer([submission], many=True)
    elif isStudentOfSub(user, submission):
      serializer = SubmissionWithCommentsSerializer([submission], many=True)
    else:
      return returnForbidden()

    return Response(serializer.data)