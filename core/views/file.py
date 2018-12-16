from core.models import File
from core.serializers.file import FileSerializer
from core.serializers.comment import CommentSerializer
from core.views.template import ListProtectedViewSet
from rest_framework.permissions import IsAuthenticated
from core.permissions.permissions import FilePermissions
from rest_framework.decorators import action
from rest_framework.response import Response

from core.permissions.helpers import returnNotAuthorized, returnForbidden, returnNotFound
from core.permissions.helpers import isAuthenticated
from core.permissions.helpers import isStudent, isGrader, isCourseAdmin, isCourseMember
from core.permissions.helpers import isStudentOfSub, isStaffOfSub

class FileViewSet(ListProtectedViewSet):
  queryset = File.objects.all()
  serializer_class = FileSerializer
  permission_classes = (IsAuthenticated, FilePermissions)