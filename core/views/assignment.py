from core.models import Assignment, RubricCategory, RubricComment
from core.serializers.assignment import AssignmentSerializer
from core.serializers.submission import SubmissionStatusSerializer, SubmissionSerializer
from core.serializers.rubricCategory import RubricCategorySerializer
from core.serializers.rubricComment import RubricCommentSerializer
from django.contrib.auth.models import User

from core.views.template import ListProtectedViewSet

from rest_framework import status
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated

from core.permissions.permissions import AssignmentPermissions
from core.permissions.helpers import returnNotAuthorized, returnForbidden, returnNotFound
from core.permissions.helpers import isAuthenticated
from core.permissions.helpers import isStudent, isGrader, isCourseAdmin, isCourseMember, isCourseStaff
from core.permissions.helpers import isStudentOfSub, isStaffOfSub

class AssignmentViewSet(ListProtectedViewSet):
  queryset = Assignment.objects.all()
  serializer_class = AssignmentSerializer
  permission_classes = (IsAuthenticated, AssignmentPermissions)

  # Extra functions
  #####################################################################################

  #Returns the serialized rubric for this assignment
  @action(detail=True)
  def rubric(self, request, pk=None):
    assignment = self.get_object()
    course = assignment.course

    categories = RubricCategory.objects.filter(assignment=assignment)
    categorySerializer = RubricCategorySerializer(categories, many=True)

    comments = RubricComment.objects.filter(category__assignment=assignment)
    commentSerializer = RubricCommentSerializer(comments, many=True)

    toRet = {
      'categories' : categorySerializer.data,
      'comments' : commentSerializer.data,
    }

    return Response(toRet)

  @action(detail=True, methods=['GET'])
  def drawUnassigned(self, request, pk=None):
    user = request.user
    assignment = self.get_object()
    course = assignment.course

    if not isGrader(user, course):
      return returnForbidden()

    section = self.request.query_params.get('section', None)

    # Use system ordering to pull random unassigned submission
    submissions = assignment.submissions.filter(grader=None)
    if section is not None:
      try:
        section = Section.objects.get(name=section, course=course)
        submissions = submissions.filter(students__in=[section.students.all()])
      except ObjectDoesNotExist:
        return returnNotFound(message="No such section")

    submission = None
    if len(submissions) > 0:
      submission = submissions[0]
      # Assign submission to grader
      # Doing this in this call is important, since it prevents two users from drawing the
      # save unassigned submission and subsequently trying to claim it
      submission.grader = user
      submission.save()

      serializer = SubmissionSerializer(submission)
      return Response(serializer.data)
    else:
      return Response(status=status.HTTP_204_NO_CONTENT)

# Optional arguments: username, grader
# If neither specified, returns full list of submissions for this assignment
  @action(detail=True)
  def submissions(self, request, pk=None):
    user = request.user
    assignment = self.get_object() # => this endpoint has permissions at least as strict
    course = assignment.course

    student = self.request.query_params.get('student', None)
    grader = self.request.query_params.get('grader', None)
    submissions = assignment.submissions.all()

    isThisGrader = isGrader(user, course) and user.username == grader
    isThisStudent = isStudent(user, course) and user.username == student

    # If you want to filter by grader, you must be that grader or a courseadmin
    if grader is not None:
      if not isCourseAdmin(user, course) and not isThisGrader:
        return returnForbidden()

    # If you want all of the submissions, you must be a courseAdmin
    if student is None and grader is None:
      if not isCourseAdmin(user, course):
        return returnForbidden()

    # If you want to filter by student, you must be a grader, courseAdmin, or that student
    if student is not None:
      if not isThisStudent and not isGrader(user, course) and not isCourseAdmin(user, course):
        return returnForbidden()

    # Retrieve student
    studentParam = None
    if student is not None:
      try:
        studentParam = User.objects.get(username=student)
      except User.DoesNotExist:
        if isCourseAdmin(user, course):
          return returnNotFound(message="The user does not exist")
        else:
          return returnForbidden()

    # Retrieve grader
    graderParam = None
    if grader is not None:
      try:
        graderParam = User.objects.get(username=grader)
      except User.DoesNotExist:
        if isCourseAdmin(user, course):
          return returnNotFound(message="The user does not exist")
        else:
          return returnForbidden()

    # Perform filtering
    filteredSubs = None
    if studentParam is not None and graderParam is not None:
      filteredSubs = submissions.filter(students__in=[studentParam],
        grader=graderParam)
    elif studentParam is not None:
      filteredSubs = submissions.filter(students__in=[studentParam])
    elif graderParam is not None:
      filteredSubs = submissions.filter(grader=graderParam)
    else:
      filteredSubs = submissions

    # If filtering for a student, only give back single submission (instead of length-1 array)
    if studentParam is not None:
      if filteredSubs is not None and len(filteredSubs) > 1:
        return Response("Whoops, something went wrong", status=status.HTTP_500_SERVER_ERROR)
      elif len(filteredSubs) == 1:
        submission = filteredSubs[0]
        serializer = SubmissionSerializer(submission)
        return Response(serializer.data)
      else:
        return Response([])

    serializer = SubmissionSerializer(filteredSubs, many=True)
    return Response(serializer.data)