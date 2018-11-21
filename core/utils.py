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

def my_jwt_response_handler(token, user=None, request=None):
    return {
        'token': token,
        'user': UserSerializer(user, context={'request': request}).data
    }

def send_mail(subject_template_name, email_template_name,
              context, from_email, to_email, html_email_template_name=None):
    """
    Send a django.core.mail.EmailMultiAlternatives to `to_email`.
    """
    subject = loader.render_to_string(subject_template_name, context)
    # Email subject *must not* contain newlines
    subject = ''.join(subject.splitlines())
    body = loader.render_to_string(email_template_name, context)

    email_message = EmailMultiAlternatives(subject, body, from_email, [to_email])
    if html_email_template_name is not None:
        html_email = loader.render_to_string(html_email_template_name, context)
        email_message.attach_alternative(html_email, 'text/html')

    email_message.send()

def emailUser(self, request, subject_template_name, email_template_name):
  # should change this to request body parameter
  email = request.POST['email']
  if email is None:
    return Response("Please specify an email", status=status.HTTP_400_BAD_REQUEST)

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

    send_mail(subject_template_name, email_template_name, context, None, email)
    return Response("Email successfully sent", status=status.HTTP_200_OK)

  except ObjectDoesNotExist:
    return Response("User not found", status=status.HTTP_400_BAD_REQUEST)

