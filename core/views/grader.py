from core.models import Grader
from core.serializers.grader import GraderSerializer
from core.serializers.course import CourseSerializer

from rest_framework import status
from rest_framework import viewsets, generics
from django.core.exceptions import ObjectDoesNotExist, MultipleObjectsReturned
from rest_framework.response import Response
from rest_framework.decorators import action

from core.permissions.helpers import returnNotAuthorized, returnForbidden, returnNotFound
from core.permissions.helpers import isAuthenticated
from core.permissions.helpers import isStudent, isGrader, isCourseAdmin, isCourseMember
from core.permissions.helpers import isStudentOfSub, isStaffOfSub

class GraderViewSet(viewsets.ModelViewSet):
  queryset = Grader.objects.all()
  serializer_class = GraderSerializer