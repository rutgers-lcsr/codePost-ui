from rest_framework import status, viewsets
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework import serializers

from core.permissions.helpers import returnNotAuthorized
from core.permissions.helpers import isAuthenticated

from django.core.exceptions import ObjectDoesNotExist
from django.contrib.auth.tokens import default_token_generator
from django.utils.http import urlsafe_base64_decode
from django.contrib.auth.models import User
from django.contrib.auth.forms import PasswordResetForm, SetPasswordForm

from core.serializers.user import UserSerializer, UserWithProfileSerializer
from core.utils import emailUser, ValidateTokenForm, ChangePasswordForm

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
    form = ValidateTokenForm(request.POST)

    if (form.is_valid()):
      uid_int = urlsafe_base64_decode(form.cleaned_data['uid']).decode()
      try:
        user = User.objects.get(id=uid_int)
      except ObjectDoesNotExist:
        return Response("User not found", status=status.HTTP_400_BAD_REQUEST)

      isValid = default_token_generator.check_token(user, form.cleaned_data['token'])
      serializer = BooleanSerialzier({"value" : str(isValid)})
      return Response(serializer.data, status=status.HTTP_200_OK)

    else:
      return Response("Bad arguments", status=status.HTTP_400_BAD_REQUEST)

  @action(detail=False, methods=['POST'])
  def updatePassword(self, request):
    form = ChangePasswordForm(request.POST)

    if (form.is_valid()):
      try:
        uid_int = urlsafe_base64_decode(form.cleaned_data['uid']).decode()
        user = User.objects.get(id=uid_int)
      except ObjectDoesNotExist:
        return Response("User not found", status=status.HTTP_400_BAD_REQUEST)

      isValid = default_token_generator.check_token(user, form.cleaned_data['token'])
      if isValid:
        # Probably should make the client side stricter than the server-side...
        user.set_password(form.cleaned_data['password'])
        user.save()
        return Response("Successfully updated password", status=status.HTTP_200_OK)
      else:
        return Response("Invalid token", status=status.HTTP_400_BAD_REQUEST)

    else:
      return Response("Bad arguments", status=status.HTTP_400_BAD_REQUEST)

  @action(detail=False, methods=['POST'])
  def activateUser(self, request):
    form = ChangePasswordForm(request.POST)

    if (form.is_valid()):
      try:
        uid_int = urlsafe_base64_decode(form.cleaned_data['uid']).decode()
        user = User.objects.get(id=uid_int)
      except ObjectDoesNotExist:
        return Response("User not found", status=status.HTTP_400_BAD_REQUEST)

      if user.is_active:
        return Response("User already active", status=status.HTTP_400_BAD_REQUEST)

      isValid = default_token_generator.check_token(user, form.cleaned_data['token'])
      if isValid:
        # Probably should make the client side stricter than the server-side...
        user.set_password(form.cleaned_data['password'])
        user.is_active = True
        user.save()
        return Response("Successfully updated password", status=status.HTTP_200_OK)
      else:
        return Response("Invalid token", status=status.HTTP_400_BAD_REQUEST)

    else:
      return Response("Bad arguments", status=status.HTTP_400_BAD_REQUEST)