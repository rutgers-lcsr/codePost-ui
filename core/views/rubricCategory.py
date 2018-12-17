from core.models import RubricCategory
from core.serializers.rubricCategory import RubricCategorySerializer
from core.views.template import ListProtectedViewSet
from rest_framework.permissions import IsAuthenticated
from core.permissions.permissions import RubricCategoryPermissions

class RubricCategoryViewSet(ListProtectedViewSet):
  queryset = RubricCategory.objects.all()
  serializer_class = RubricCategorySerializer
  permission_classes = (IsAuthenticated, RubricCategoryPermissions)