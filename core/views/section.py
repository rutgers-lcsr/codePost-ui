from core.models import Section
from core.serializers.section import SectionSerializer, SectionWithStudentsSerializer
from core.serializers.student import StudentSerializer
from core.serializers.grader import GraderSerializer

from core.permissions.helpers import returnNotAuthorized, returnForbidden, returnNotFound
from core.permissions.helpers import isAuthenticated
from core.permissions.helpers import isStudent, isGrader, isCourseAdmin, isCourseMember
from core.permissions.helpers import isStudentOfSub, isStaffOfSub

from rest_framework import status
from rest_framework import viewsets, generics
from django.core.exceptions import ObjectDoesNotExist, MultipleObjectsReturned
from rest_framework.response import Response
from rest_framework.decorators import action

from core.models import User
from core.utils import EmailForm, EnrollForm, sendMail

class SectionViewSet(viewsets.ModelViewSet):
  queryset = Section.objects.all()
  serializer_class = SectionSerializer

  @action(detail=True, methods=['patch'])
  def addStudent(self, request, pk=None):
      user = request.user
      if not isAuthenticated(user):
        return returnNotAuthorized()

      form = EnrollForm(request.POST)
      if (form.is_valid()):
        section = Section.objects.get(id=pk)
        course = section.course

        # courseAdmin permissions required
        if not isCourseAdmin(user, course):
          return returnForbidden()

        email = form.cleaned_data['email']

        try:
          userParameter = User.objects.get(username=email)
        except:
          return returnNotFound(message="User does not exist.")

        if userParameter.profile.student not in course.students.all():
            return Response("User is not enrolled in this course", status=status.HTTP_400_BAD_REQUEST)

        section.students.add(userParameter.profile.student)
        section.save()
        serializer = StudentSerializer(userParameter.profile.student ,context={'request' : request})
        return Response(serializer.data)

      else:
        return Response(form.errors, status=status.HTTP_400_BAD_REQUEST)

  @action(detail=True, methods=['patch'])
  def addLeader(self, request, pk=None):
      user = request.user
      if not isAuthenticated(user):
        return returnNotAuthorized()

      form = EnrollForm(request.POST)
      if (form.is_valid()):
        section = Section.objects.get(id=pk)
        course = section.course

        # courseAdmin permissions required
        if not isCourseAdmin(user, course):
          return returnForbidden()

        email = form.cleaned_data['email']

        try:
          userParameter = User.objects.get(username=email)
        except:
          return returnNotFound(message="User does not exist.")

        if userParameter.profile.grader not in course.graders.all():
            return Response("User is not a grader in this course", status=status.HTTP_400_BAD_REQUEST)

        # Currently accomodating for one-leader-per-section front end. need to change to be flexible
        section.leader.clear()
        section.leader.add(userParameter.profile.grader)
        section.save()
        serializer = GraderSerializer(userParameter.profile.grader ,context={'request' : request})
        return Response(serializer.data)

      else:
        return Response(form.errors, status=status.HTTP_400_BAD_REQUEST)
