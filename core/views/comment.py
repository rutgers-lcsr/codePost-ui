from core.models import Comment
from core.serializers.comment import CommentSerializer
from core.views.template import ListProtectedViewSet
from rest_framework.permissions import IsAuthenticated
from core.permissions.permissions import CommentPermissions

class CommentViewSet(ListProtectedViewSet):
  queryset = Comment.objects.all()
  serializer_class = CommentSerializer
  permission_classes = (IsAuthenticated, CommentPermissions)