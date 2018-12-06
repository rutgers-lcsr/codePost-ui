from core.models import RubricComment
from core.serializers.rubricComment import RubricCommentSerializer
from core.views.template import ListProtectedViewSet
from rest_framework.permissions import IsAuthenticated
from core.permissions.permissions import RubricCommentPermissions

class RubricCommentViewSet(ListProtectedViewSet):
  queryset = RubricComment.objects.all()
  serializer_class = RubricCommentSerializer
  permission_classes = (IsAuthenticated, RubricCommentPermissions)