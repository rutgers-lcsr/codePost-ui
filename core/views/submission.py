from core.models import Submission
from core.serializers.submission import SubmissionWithCommentsAuthorsSerializer, SubmissionSerializer

from rest_framework.response import Response
from rest_framework.decorators import action

from core.views.template import ListProtectedViewSet
from rest_framework.permissions import IsAuthenticated
from core.permissions.permissions import SubmissionPermissions

class SubmissionViewSet(ListProtectedViewSet):
  queryset = Submission.objects.all()
  serializer_class = SubmissionSerializer
  permission_classes = (IsAuthenticated, SubmissionPermissions)

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