from django.contrib.auth.models import User
from core.serializers.user import UserSerializer, UserWithProfileSerializer

from rest_framework import status
from rest_framework import viewsets, generics
from django.core.exceptions import ObjectDoesNotExist, MultipleObjectsReturned
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework import serializers

from core.permissions.helpers import returnNotAuthorized, returnForbidden, returnNotFound
from core.permissions.helpers import isAuthenticated
from core.permissions.helpers import isStudent, isGrader, isCourseAdmin, isCourseMember
from core.permissions.helpers import isStudentOfSub, isStaffOfSub

from django.contrib.auth.tokens import default_token_generator
from django.contrib.sites.shortcuts import get_current_site
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.utils.encoding import force_bytes, force_text

from django.contrib.auth.forms import PasswordResetForm, SetPasswordForm
from core.utils import emailUser

class BooleanSerialzier(serializers.Serializer):
  value = serializers.BooleanField()

class UserViewSet(viewsets.ModelViewSet):
  queryset = User.objects.all().order_by('-date_joined')
  serializer_class = UserSerializer

  @action(detail=False)
  def me(self, request):
    user = request.user
    if not isAuthenticated(user):
      return returnNotAuthorized()

    serializer = UserWithProfileSerializer(user)
    return Response(serializer.data)

  @action(detail=False, methods=['POST'])
  def emailPasswordReset(self, request):
    subject_template_name = 'registration/password_reset_subject.txt'
    email_template_name = 'registration/password_reset_email.html'
    return emailUser(self, request, subject_template_name, email_template_name)

  @action(detail=False, methods=['POST'])
  def emailRegistration(self, request):
    subject_template_name = 'registration/user_registration_subject.txt'
    email_template_name = 'registration/user_registration_email.html'
    return emailUser(self, request, subject_template_name, email_template_name)

  @action(detail=False, methods=['POST'])
  def isTokenValid(self, request):
    # validate inputs using Django forms
    token = request.POST['token']
    uid = request.POST['uid']
    uid_int = urlsafe_base64_decode(uid).decode()

    try:
      user = User.objects.get(id=uid_int)
    except ObjectDoesNotExist:
      return Response("User not found", status=status.HTTP_400_BAD_REQUEST)

    isValid = default_token_generator.check_token(user, token)
    serializer = BooleanSerialzier({"value" : str(isValid)})
    return Response(serializer.data, status=status.HTTP_200_OK)

  @action(detail=False, methods=['POST'])
  def updatePassword(self, request):
    token = request.POST['token']
    uid = request.POST['uid']
    password = request.POST['password']

    uid_int = urlsafe_base64_decode(uid).decode()
    user = User.objects.get(id=uid_int)
    isValid = default_token_generator.check_token(user, token)

    if isValid:
      # Probably should make the client side stricter than the server-side...
      user.set_password(password)
      user.save()
      return Response("Successfully updated password", status=status.HTTP_200_OK)
    else:
      return Response("Invalid token", status=status.HTTP_400_BAD_REQUEST)


  @action(detail=False, methods=['POST'])
  def activateUser(self, request):
    token = request.POST['token']
    uid = request.POST['uid']
    password = request.POST['password']

    uid_int = urlsafe_base64_decode(uid).decode()
    user = User.objects.get(id=uid_int)
    isValid = default_token_generator.check_token(user, token)

    if isValid:
      # Probably should make the client side stricter than the server-side...
      user.is_active = True
      user.set_password(password)
      user.save()
      return Response("Successfully activated", status=status.HTTP_200_OK)
    else:
      return Response("Invalid token", status=status.HTTP_400_BAD_REQUEST)