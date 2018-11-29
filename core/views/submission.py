from core.models import Submission
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

from core.utils import EmailForm

class SubmissionViewSet(viewsets.ModelViewSet):
  queryset = Submission.objects.all()
  serializer_class = SubmissionWithCommentsAuthorsSerializer

  # Option: Could choose to throw an error if the submission is finalized
  @action(detail=True, methods=['patch'])
  def finalize(self, request, pk=None):
    user = request.user
    if not isAuthenticated(user):
      return returnNotAuthorized()

    submission = Submission.objects.get(id=pk)
    course = submission.assignment.course
    if not isStaffOfSub(user, submission):
      return returnForbidden()

    submission.isFinalized = True
    submission.save()
    serializer = SubmissionWithCommentsAuthorsSerializer(submission)
    return Response(serializer.data)

  # Option: Could choose to throw an error if the submission is not finalized
  @action(detail=True, methods=['patch'])
  def takeBack(self, request, pk=None):
    user = request.user
    if not isAuthenticated(user):
      return returnNotAuthorized()

    submission = Submission.objects.get(id=pk)
    course = submission.assignment.course
    if not isStaffOfSub(user, submission):
      return returnForbidden()

    submission.isFinalized = False
    submission.save()
    serializer = SubmissionWithCommentsAuthorsSerializer(submission)
    return Response(serializer.data)

  # Option: Could choose to throw an error if the submission is already unassigned
  @action(detail=True, methods=['patch'])
  def unassign(self, request, pk=None):
    user = request.user
    if not isAuthenticated(user):
      return returnNotAuthorized()

    submission = Submission.objects.get(id=pk)
    course = submission.assignment.course
    if not isStaffOfSub(user, submission):
      return returnForbidden()

    submission.grader = None
    submission.save()
    serializer = SubmissionWithCommentsAuthorsSerializer(submission)
    return Response(serializer.data)

  @action(detail=True, methods=['patch'])
  def assign(self, request, pk=None):
    user = request.user
    if not isAuthenticated(user):
      return returnNotAuthorized()

    form = EmailForm(request.POST)
    if form.is_valid():
      submission = Submission.objects.get(id=pk)
      course = submission.assignment.course
      email = form.cleaned_data['email']

      isVaildGrader = isGrader(user, course) and user.email==email
      if not isCourseAdmin(user, course) and not isVaildGrader:
        return returnForbidden()

      try:
        user = User.objects.get(email=email)
      except User.DoesNotExist:
        return Response("Please specify a valid grader", status=status.HTTP_400_BAD_REQUEST)

      graders = course.graders
      if user.profile.grader not in graders:
        return Response("Please specify a valid grader", status=status.HTTP_400_BAD_REQUEST)

      submission.grader = user.profile.grader
      submission.save()
      serializer = SubmissionWithCommentsAuthorsSerializer(submission)
      return Response(serializer.data)
    else:
      return Response(form.errors, status=status.HTTP_400_BAD_REQUEST)

  @action(detail=True, methods=['patch'])
  def clearComments(self, request, pk=None):
    user = request.user
    if not isAuthenticated(user):
      return returnNotAuthorized()

    submission = Submission.objects.get(id=pk)
    if not isStaffOfSub(user, submission):
      return returnForbidden()

    files = submission.files
    for f in files:
      f.comments.delete()

    submission.save()
    serializer = SubmissionWithCommentsAuthorsSerializer(submission)
    return Response(serializer.data)