from core.models import Organization
from core.serializers.organization import OrganizationSerializer
from core.views.template import ListProtectedViewSet
from rest_framework.permissions import IsAuthenticated
from core.permissions.permissions import OrganizationPermissions

class OrganizationViewSet(ListProtectedViewSet):
  queryset = Organization.objects.all()
  serializer_class = OrganizationSerializer
  permission_classes = (IsAuthenticated, OrganizationPermissions)
