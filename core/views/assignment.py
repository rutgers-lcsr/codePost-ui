from core.models import Assignment, RubricCategory
from core.serializers.assignment import AssignmentSerializer
from core.serializers.submission import SubmissionWithCommentsSerializer, SubmissionWithCommentsAuthorsSerializer, SubmissionStatusSerializer
from core.serializers.rubric import RubricCategorySerializer
from django.contrib.auth.models import User

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

  @action(detail=True, methods=['GET'])
  def toggleReleased(self, request, pk=None):
    user = request.user
    if not isAuthenticated(user):
      return returnNotAuthorized()

    assignment = Assignment.objects.get(id=pk)
    course = assignment.course

    if not isCourseAdmin(user, course):
      return returnForbidden()

    assignment.isReleased = not assignment.isReleased
    assignment.save()
    serializer = AssignmentSerializer(assignment)
    return Response(serializer.data)

  @action(detail=True, methods=['patch'])
  def drawUnassigned(self, request, pk=None):
    user = request.user
    if not isAuthenticated(user):
      return returnNotAuthorized()

    assignment = Assignment.objects.get(id=pk)
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
      submission.grader = user.profile.grader
      submission.save()

      serializer = SubmissionWithCommentsAuthorsSerializer(submission)
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

    assignment = Assignment.objects.get(id=pk)
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
      filteredSubs = submissions.filter(students__in=[studentParam.profile.student],
        grader=graderParam.profile.grader)
    elif studentParam is not None:
      filteredSubs = submissions.filter(students__in=[studentParam.profile.student])
    elif graderParam is not None:
      filteredSubs = submissions.filter(grader=graderParam.profile.grader)
    else:
      filteredSubs = submissions

    # Only include comment authors in serialization if user is authorized to see them
    serializer = SubmissionWithCommentsSerializer(filteredSubs, many=True)
    if studentParam is not None:
      if filteredSubs is not None and len(filteredSubs) > 1:
        return Response("Whoops, something went wrong", status=status.HTTP_500_SERVER_ERROR)
      elif len(filteredSubs) == 1:
        submission = filteredSubs[0]
        if isStaffOfSub(user, submission):
          serializer = SubmissionWithCommentsAuthorsSerializer(filteredSubs, many=True)
        else:
          if submission.isFinalized == False or assignment.isReleased == False:
            serializer = SubmissionStatusSerializer(filteredSubs, many=True)
          else:
            serializer = SubmissionWithCommentsSerializer(filteredSubs, many=True)

    if isCourseAdmin(user, course):
        serializer = SubmissionWithCommentsAuthorsSerializer(filteredSubs, many=True)

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
