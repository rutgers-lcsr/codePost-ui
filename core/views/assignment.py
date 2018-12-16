from core.models import Assignment, RubricCategory
from core.serializers.assignment import AssignmentSerializer
from core.serializers.submission import SubmissionStatusSerializer, SubmissionSerializer
from django.contrib.auth.models import User

from core.views.template import ListProtectedViewSet

from rest_framework import status
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated

from core.permissions.permissions import AssignmentPermissions
from core.permissions.helpers import returnNotAuthorized, returnForbidden, returnNotFound
from core.permissions.helpers import isAuthenticated
from core.permissions.helpers import isStudent, isGrader, isCourseAdmin, isCourseMember
from core.permissions.helpers import isStudentOfSub, isStaffOfSub

class AssignmentViewSet(ListProtectedViewSet):
  queryset = Assignment.objects.all()
  serializer_class = AssignmentSerializer
  permission_classes = (IsAuthenticated, AssignmentPermissions)

  # Extra functions
  #####################################################################################

  @action(detail=True, methods=['GET'])
  def drawUnassigned(self, request, pk=None):
    user = request.user
    if not isAuthenticated(user):
      return returnNotAuthorized()

    assignment = self.get_object()
    course = assignment.course

    if not isGrader(user, course):
      return returnForbidden()

    section = self.request.query_params.get('section', None)

    print (assignment)
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
    if not isAuthenticated(user):
      return returnNotAuthorized()

    assignment = self.get_object()
    course = assignment.course

    if not isCourseMember(user, course):
      return returnForbidden()

    student = self.request.query_params.get('student', None)
    grader = self.request.query_params.get('grader', None)
    submissions = assignment.submissions.all()

    # If you want to filter by grader, you must be that grader or a courseadmin
    isThisGrader = isGrader(user, course) and user.username == grader
    isThisStudent = isStudent(user, course) and user.username == student

    if student is None and grader is None:
      if not isCourseAdmin(user, course):
        return returnForbidden()

    if grader is not None:
      if not isCourseAdmin(user, course) and not isThisGrader:
        return returnForbidden()

    if student is not None:
      if not isThisStudent and not isGrader(user, course) and not isCourseAdmin(user, course):
        return returnForbidden()

    studentParam = None
    if student is not None:
      try:
        studentParam = User.objects.get(username=student)
      except User.DoesNotExist:
        if isCourseAdmin(user, course):
          return returnNotFound(message="The user does not exist")
        else:
          return returnForbidden()

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

    # Only include comment authors in serialization if user is authorized to see them
    serializer = SubmissionSerializer(filteredSubs, many=True)
    if studentParam is not None:
      if filteredSubs is not None and len(filteredSubs) > 1:
        return Response("Whoops, something went wrong", status=status.HTTP_500_SERVER_ERROR)
      elif len(filteredSubs) == 1:
        submission = filteredSubs[0]

    return Response(serializer.data)

#Returns the serialized rubric for this assignment
  @action(detail=True)
  def rubric(self, request, pk=None):
    user = request.user
    if not isAuthenticated(user):
      return returnNotAuthorized()

    assignment = Assignment.objects.get(id=pk)
    course = assignment.course

    if not isCourseMember(user, course):
      return returnForbidden()

    rubric = RubricCategory.objects.filter(assignment=assignment)

    serializer = RubricCategorySerializer(rubric, many=True)
    return Response(serializer.data)