from core.models import File
from core.serializers.file import FileSerializer
from core.views.template import ListProtectedViewSet
from rest_framework.permissions import IsAuthenticated
from core.permissions.permissions import FilePermissions

class FileViewSet(ListProtectedViewSet):
  queryset = File.objects.all()
  serializer_class = FileSerializer
  permission_classes = (IsAuthenticated, FilePermissions)