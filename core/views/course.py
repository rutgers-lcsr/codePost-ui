from core.models import Course
from core.serializers.course import AssignmentSerializer
from core.serializers.course import CourseSerializer
from core.serializers.section import SectionWithStudentsSerializer
from core.serializers.student import StudentSerializer
from core.serializers.grader import GraderSerializer
from core.serializers.courseadmin import CourseAdminSerializer
from core.serializers.rubric import RubricCategorySerializer, RubricCommentSerializer

from rest_framework import status
from rest_framework import viewsets, generics
from django.core.exceptions import ObjectDoesNotExist, MultipleObjectsReturned
from rest_framework.response import Response
from rest_framework.decorators import action

from core.permissions.helpers import returnNotAuthorized, returnForbidden, returnNotFound
from core.permissions.helpers import isAuthenticated
from core.permissions.helpers import isStudent, isGrader, isCourseAdmin, isCourseMember
from core.permissions.helpers import isStudentOfSub, isStaffOfSub

from core.models import User, RubricCategory, RubricComment, Assignment
from core.utils import EmailForm, EnrollForm, sendMail, IDForm, CommentForm

class CourseViewSet(viewsets.ModelViewSet):
  queryset = Course.objects.all()
  serializer_class = CourseSerializer

  @action(detail=True, methods=['patch'])
  def removeStudent(self, request, pk=None):
    user = request.user
    if not isAuthenticated(user):
      return returnNotAuthorized()

    form = EmailForm(request.POST)
    if form.is_valid():
      course = Course.objects.get(id=pk)

      if not isCourseAdmin(user, course):
        return returnForbidden()

      try:
        userParameter = User.objects.get(email=form.cleaned_data['email'])
      except:
        return returnNotFound(message="User is not enrolled as a student in this course")

      if userParameter.profile.student not in course.students.all():
        return Response("User is not enrolled as a student in this course", status=status.HTTP_400_BAD_REQUEST)

      course.students.remove(userParameter.profile.student)
      course.save()
      serializer = StudentSerializer(userParameter.profile.student, context={'request' : request})
      return Response(serializer.data)
    else:
      return Response(form.errors, status=status.HTTP_400_BAD_REQUEST)

  @action(detail=True, methods=['patch'])
  def removeGrader(self, request, pk=None):
    user = request.user
    if not isAuthenticated(user):
      return returnNotAuthorized()

    form = EmailForm(request.POST)
    if (form.is_valid()):
      course = Course.objects.get(id=pk)

      if not isCourseAdmin(user, course):
        return returnForbidden()

      try:
        userParameter = User.objects.get(email=form.cleaned_data['email'])
      except:
        return returnNotFound(message="User is not enrolled as a grader in this course")

      if userParameter.profile.grader not in course.graders.all():
        return Response("User is not enrolled as a grader in this course", status=status.HTTP_400_BAD_REQUEST)

      course.graders.remove(userParameter.profile.grader)
      course.save()
      serializer = GraderSerializer(userParameter.profile.grader, context={'request' : request})
      return Response(serializer.data)
    else:
      return Response(form.errors, status=status.HTTP_400_BAD_REQUEST)

  @action(detail=True, methods=['patch'])
  def removeCourseAdmin(self, request, pk=None):
    user = request.user
    if not isAuthenticated(user):
      return returnNotAuthorized()

    form = EmailForm(request.POST)
    if form.is_valid():
      course = Course.objects.get(id=pk)

      if not isCourseAdmin(user, course):
        return returnForbidden()

      try:
        userParameter = User.objects.get(email=form.cleaned_data['email'])
      except:
        return returnNotFound(message="User is not enrolled as a CourseAdmin in this course")

      if userParameter.profile.courseadmin not in course.courseAdmins.all():
        return Response("User is not enrolled as a CourseAdmin in this course", status=status.HTTP_400_BAD_REQUEST)

      course.courseAdmins.remove(userParameter.profile.courseadmin)
      course.save()
      serializer = CourseAdminSerializer(userParameter.profile.courseadmin, context={'request' : request})
      return Response(serializer.data)
    else:
      return Response(form.errors, status=status.HTTP_400_BAD_REQUEST)

  @action(detail=True, methods=['patch'])
  def enrollStudent(self, request, pk=None):
    user = request.user
    if not isAuthenticated(user):
      return returnNotAuthorized()

    form = EnrollForm(request.POST)
    if (form.is_valid()):
      course = Course.objects.get(id=pk)

      # courseAdmin permissions required
      if not isCourseAdmin(user, course):
        return returnForbidden()

      activate = form.cleaned_data['activate']
      email = form.cleaned_data['email']

      try:
        userParameter = User.objects.get(username=email)
      except:
        userParameter = User.objects.create(username=email, email=email)
        if activate:
          subject_template_name = 'registration/user_registration_subject.txt'
          email_template_name = 'registration/user_registration_email.html'
          sendMail(request, user, subject_template_name, email_template_name)

      course.students.add(userParameter.profile.student)
      course.save()
      serializer = StudentSerializer(userParameter.profile.student ,context={'request' : request})
      return Response(serializer.data)

    else:
      return Response(form.errors, status=status.HTTP_400_BAD_REQUEST)

  @action(detail=True, methods=['patch'])
  def enrollGrader(self, request, pk=None):
    user = request.user
    if not isAuthenticated(user):
      return returnNotAuthorized()

    form = EnrollForm(request.POST)
    if (form.is_valid()):
      course = Course.objects.get(id=pk)

      # courseAdmin permissions required
      if not isCourseAdmin(user, course):
        return returnForbidden()

      activate = form.cleaned_data['activate']
      email = form.cleaned_data['email']

      try:
        userParameter = User.objects.get(username=email)
      except:
        userParameter = User.objects.create(username=email, email=email)
        if activate:
          subject_template_name = 'registration/user_registration_subject.txt'
          email_template_name = 'registration/user_registration_email.html'
          sendMail(request, user, subject_template_name, email_template_name)

      course.graders.add(userParameter.profile.grader)
      course.save()
      serializer = GraderSerializer(userParameter.profile.grader ,context={'request' : request})
      return Response(serializer.data)

    else:
      return Response(form.errors, status=status.HTTP_400_BAD_REQUEST)

  @action(detail=True, methods=['patch'])
  def enrollCourseAdmin(self, request, pk=None):
    user = request.user
    if not isAuthenticated(user):
      return returnNotAuthorized()

    form = EnrollForm(request.POST)
    if (form.is_valid()):
      course = Course.objects.get(id=pk)

      # courseAdmin permissions required
      if not isCourseAdmin(user, course):
        return returnForbidden()

      activate = form.cleaned_data['activate']
      email = form.cleaned_data['email']

      try:
        userParameter = User.objects.get(username=email)
      except:
        userParameter = User.objects.create(username=email, email=email)
        if activate:
          subject_template_name = 'registration/user_registration_subject.txt'
          email_template_name = 'registration/user_registration_email.html'
          sendMail(request, user, subject_template_name, email_template_name)

      course.courseAdmins.add(userParameter.profile.courseadmin)
      course.save()
      serializer = CourseAdminSerializer(userParameter.profile.courseadmin ,context={'request' : request})
      return Response(serializer.data)

    else:
      return Response(form.errors, status=status.HTTP_400_BAD_REQUEST)

  @action(detail=True)
  def students(self, request, pk=None):
    user = request.user
    if not isAuthenticated(user):
      return returnNotAuthorized()

    course = Course.objects.get(id=pk)

    if not isCourseAdmin(user, course):
      return returnForbidden()

    students = course.students.all()
    serializer = StudentSerializer(students, many=True, context={'request' : request})
    return Response(serializer.data)

  @action(detail=True)
  def graders(self, request, pk=None):
    user = request.user
    if not isAuthenticated(user):
      return returnNotAuthorized()

    course = Course.objects.get(id=pk)

    if not isCourseAdmin(user, course):
      return returnForbidden()

    graders = course.graders.all()
    serializer = GraderSerializer(graders, many=True, context={'request' : request})
    return Response(serializer.data)

  @action(detail=True)
  def courseadmins(self, request, pk=None):
    user = request.user
    if not isAuthenticated(user):
      return returnNotAuthorized()

    course = Course.objects.get(id=pk)

    if not isCourseAdmin(user, course):
      return returnForbidden()

    courseadmins = course.courseAdmins.all()
    serializer = CourseAdminSerializer(courseadmins, many=True, context={'request' : request})
    return Response(serializer.data)

  @action(detail=True)
  def sections(self, request, pk=None):
    user = request.user
    if not isAuthenticated(user):
      return returnNotAuthorized()

    course = Course.objects.get(id=pk)

    if not isCourseAdmin(user, course) and not isGrader(user, course):
      return returnForbidden()

    sections = course.sections.all()
    serializer = SectionWithStudentsSerializer(sections, many=True)
    return Response(serializer.data)


  @action(detail=True, methods=['patch'])
  def deleteRubricCategory(self, request, pk=None):
    user = request.user
    if not isAuthenticated(user):
      return returnNotAuthorized()

    form = IDForm(request.POST)
    if (form.is_valid()):
      course = Course.objects.get(id=pk)

      if not isCourseAdmin(user, course):
        return returnForbidden()

      try:
        category = RubricCategory.objects.get(id=form.cleaned_data['id'])
      except:
        return returnNotFound(message="Category doesn't exist")

      category.delete()
      return Response(status=status.HTTP_204_NO_CONTENT)
    else:
      return Response(form.errors, status=status.HTTP_400_BAD_REQUEST)

  @action(detail=True, methods=['patch'])
  def deleteRubricComment(self, request, pk=None):
    user = request.user
    if not isAuthenticated(user):
      return returnNotAuthorized()

    form = IDForm(request.POST)
    if (form.is_valid()):
      course = Course.objects.get(id=pk)

      if not isCourseAdmin(user, course):
        return returnForbidden()

      try:
        comment = RubricComment.objects.get(id=form.cleaned_data['id'])
      except:
        return returnNotFound(message="Comment doesn't exist")

      comment.delete()
      return Response(status=status.HTTP_204_NO_CONTENT)
    else:
      return Response(form.errors, status=status.HTTP_400_BAD_REQUEST)

  @action(detail=True, methods=['patch'])
  def updateRubricComment(self, request, pk=None):
    user = request.user
    if not isAuthenticated(user):
      return returnNotAuthorized()

    form = CommentForm(request.POST)
    if (form.is_valid()):
      course = Course.objects.get(id=pk)

      if not isCourseAdmin(user, course):
        return returnForbidden()

      try:
        comment = RubricComment.objects.get(id=form.cleaned_data['id'])
      except:
        return returnNotFound(message="Comment doesn't exist")

      comment.text = form.cleaned_data['text']
      comment.pointDelta = float(form.cleaned_data['pointDelta'])
      comment.save()

      serializer = RubricCommentSerializer(comment)
      return Response(serializer.data)
    else:
      return Response(form.errors, status=status.HTTP_400_BAD_REQUEST)

  @action(detail=True, methods=['patch'])
  def updateRubricCategory(self, request, pk=None):
    user = request.user
    if not isAuthenticated(user):
      return returnNotAuthorized()

    form = CommentForm(request.POST)
    if (form.is_valid()):
      course = Course.objects.get(id=pk)

      if not isCourseAdmin(user, course):
        return returnForbidden()

      try:
        category = RubricCategory.objects.get(id=form.cleaned_data['id'])
      except:
        return returnNotFound(message="Comment doesn't exist")

      category.name = form.cleaned_data['text']
      category.pointLimit = int(form.cleaned_data['pointDelta'])
      category.save()

      serializer = RubricCategorySerializer(category)
      return Response(serializer.data)
    else:
      return Response(form.errors, status=status.HTTP_400_BAD_REQUEST)

  @action(detail=True, methods=['patch'])
  # Need to add isReleased
  def updateAssignment(self, request, pk=None):
    user = request.user
    if not isAuthenticated(user):
      return returnNotAuthorized()

    form = CommentForm(request.POST)
    if (form.is_valid()):
      course = Course.objects.get(id=pk)

      if not isCourseAdmin(user, course):
        return returnForbidden()

      try:
        assignment = Assignment.objects.get(id=form.cleaned_data['id'])
      except:
        return returnNotFound(message="Assignment doesn't exist")

      assignment.points = int(form.cleaned_data['pointDelta'])
      assignment.save()

      serializer = AssignmentSerializer(assignment)
      return Response(serializer.data)
    else:
      return Response(form.errors, status=status.HTTP_400_BAD_REQUEST)
