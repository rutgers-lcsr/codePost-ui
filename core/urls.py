from django.urls import path, re_path, include
from django.views.generic import TemplateView
from core.views.auth import current_user, UserList

urlpatterns = [
  path('current_user/', current_user),
  path('users/', UserList.as_view()),
  re_path('.*', TemplateView.as_view(template_name='index.html')),
]
