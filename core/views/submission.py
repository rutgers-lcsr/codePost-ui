from core.models import Submission
from core.serializers.submission import SubmissionSerializer

from rest_framework.response import Response
from rest_framework.decorators import action

from core.views.template import ListProtectedViewSet
from rest_framework.permissions import IsAuthenticated
from core.permissions.permissions import SubmissionPermissions

class SubmissionViewSet(ListProtectedViewSet):
  queryset = Submission.objects.all()
  serializer_class = SubmissionSerializer
  permission_classes = (IsAuthenticated, SubmissionPermissions)
