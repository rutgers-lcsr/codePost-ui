from core.models import Section
from core.serializers.section import SectionSerializer
from core.views.template import ListProtectedViewSet
from rest_framework.permissions import IsAuthenticated
from core.permissions.permissions import SectionPermissions

class SectionViewSet(ListProtectedViewSet):
  queryset = Section.objects.all()
  serializer_class = SectionSerializer
  permission_classes = (IsAuthenticated, SectionPermissions)
