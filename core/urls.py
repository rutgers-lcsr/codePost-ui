from django.urls import path, re_path, include
from django.views.generic import TemplateView
from core.views.auth import current_user

urlpatterns = [
  path('current_user/', current_user),
  re_path('.*', TemplateView.as_view(template_name='index.html')),
]
