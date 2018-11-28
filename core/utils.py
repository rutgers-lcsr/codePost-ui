from core.serializers.user import UserSerializer
from django.template import loader
from django.core.mail import EmailMultiAlternatives

from django.contrib.auth.tokens import default_token_generator
from django.contrib.sites.shortcuts import get_current_site
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.utils.encoding import force_bytes, force_text
from django.core.exceptions import ObjectDoesNotExist
from django.contrib.auth.models import User
from rest_framework.response import Response
from rest_framework import status
from django import forms

from django.contrib.auth.forms import PasswordResetForm, SetPasswordForm

def my_jwt_response_handler(token, user=None, request=None):
    return {
        'token': token,
        'user': UserSerializer(user, context={'request': request}).data
    }

def emailUser(self, request, subject_template_name, email_template_name):
  form = PasswordResetForm(request.POST)

  if not form.is_valid():
    return Response("Please specify an email", status=status.HTTP_400_BAD_REQUEST)

  email = form.cleaned_data['email']

  try:
    user = User.objects.get(email=email)
    current_site = get_current_site(request)
    site_name = current_site.name
    domain = current_site.domain

    context = {
        'email': email,
        'domain': domain,
        'site_name': site_name,
        'uid': urlsafe_base64_encode(force_bytes(user.pk)).decode(),
        'user': user,
        'token': default_token_generator.make_token(user),
        'protocol': 'https',
    }

    form.send_mail(subject_template_name, email_template_name, context, None, email)
    return Response("Email successfully sent", status=status.HTTP_200_OK)

  except ObjectDoesNotExist:
    return Response("User not found", status=status.HTTP_400_BAD_REQUEST)

class ValidateTokenForm(forms.Form):
  token = forms.CharField(min_length=20, strip=True)
  uid = forms.CharField()

class ChangePasswordForm(forms.Form):
  token = forms.CharField(min_length=20, strip=True)
  uid = forms.CharField()
  password = password = forms.CharField(strip=False)